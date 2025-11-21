-- =====================================================
-- Complete Database Initialization Script
-- StableSPY - Stock Trading Platform on Aptos
-- Supports 0.1% transaction fees
-- Fee-aware portfolio tracking with weighted average cost
-- =====================================================

-- Drop existing objects (in reverse dependency order)
DROP TRIGGER IF EXISTS transaction_trigger ON transactions;
DROP FUNCTION IF EXISTS process_transaction_trigger CASCADE;
DROP FUNCTION IF EXISTS upsert_user CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS portfolio_positions CASCADE;
DROP TABLE IF EXISTS currency_balances CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(66) UNIQUE NOT NULL,
    base_currency VARCHAR(3) DEFAULT 'INR' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_wallet ON users(wallet_address);

COMMENT ON TABLE users IS 'User accounts with wallet addresses';

-- =====================================================
-- 2. CURRENCY BALANCES TABLE
-- =====================================================
CREATE TABLE currency_balances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency_symbol VARCHAR(3) NOT NULL,
    balance NUMERIC(20, 6) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, currency_symbol)
);

CREATE INDEX idx_currency_balances_user ON currency_balances(user_id);
CREATE INDEX idx_currency_balances_user_currency ON currency_balances(user_id, currency_symbol);

COMMENT ON TABLE currency_balances IS 'User currency holdings';

-- =====================================================
-- 3. PORTFOLIO POSITIONS TABLE
-- =====================================================
CREATE TABLE portfolio_positions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stock_symbol VARCHAR(10) NOT NULL,
    current_quantity NUMERIC(20, 6) DEFAULT 0 NOT NULL,
    total_cost_basis NUMERIC(20, 6) DEFAULT 0 NOT NULL,
    average_cost_per_share NUMERIC(20, 6) DEFAULT 0 NOT NULL,
    realized_profit_loss NUMERIC(20, 6) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, stock_symbol)
);

CREATE INDEX idx_portfolio_user ON portfolio_positions(user_id);
CREATE INDEX idx_portfolio_stock ON portfolio_positions(stock_symbol);
CREATE INDEX idx_portfolio_user_stock ON portfolio_positions(user_id, stock_symbol);

COMMENT ON TABLE portfolio_positions IS 'User stock holdings with cost basis tracking';
COMMENT ON COLUMN portfolio_positions.total_cost_basis IS 'Total amount invested including fees';

-- =====================================================
-- 4. TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stock_symbol VARCHAR(10),
    currency_symbol VARCHAR(3),
    transaction_type VARCHAR(10) NOT NULL,
    quantity NUMERIC(20, 6) NOT NULL,
    total_value NUMERIC(20, 6) NOT NULL,
    fee_amount NUMERIC(20, 6) DEFAULT 0 NOT NULL,
    realized_pnl NUMERIC(20, 6),
    base_currency VARCHAR(3) NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    status VARCHAR(20) DEFAULT 'SUCCESS' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (transaction_type IN ('BUY', 'SELL') AND stock_symbol IS NOT NULL AND currency_symbol IS NULL)
        OR
        (transaction_type IN ('MINT', 'BURN') AND currency_symbol IS NOT NULL AND stock_symbol IS NULL)
    )
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_stock ON transactions(stock_symbol);
CREATE INDEX idx_transactions_currency ON transactions(currency_symbol);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transactions_user_stock ON transactions(user_id, stock_symbol);
CREATE INDEX idx_transactions_user_currency ON transactions(user_id, currency_symbol);

COMMENT ON TABLE transactions IS 'All trading and currency operations';
COMMENT ON COLUMN transactions.total_value IS 'Stock purchase amount (EXCLUDING fees for display)';
COMMENT ON COLUMN transactions.fee_amount IS '0.1% transaction fee';
COMMENT ON COLUMN transactions.realized_pnl IS 'Realized P&L for SELL transactions';

-- =====================================================
-- 5. UPSERT USER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION upsert_user(
    p_wallet_address VARCHAR(66),
    p_base_currency VARCHAR(3) DEFAULT 'INR'
)
RETURNS INTEGER AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    SELECT id INTO v_user_id
    FROM users
    WHERE wallet_address = p_wallet_address;

    IF v_user_id IS NULL THEN
        INSERT INTO users (wallet_address, base_currency)
        VALUES (p_wallet_address, p_base_currency)
        RETURNING id INTO v_user_id;
    END IF;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION upsert_user IS 'Creates user if not exists, returns user_id';

-- =====================================================
-- 6. TRANSACTION TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION process_transaction_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_position RECORD;
    v_new_quantity NUMERIC(20, 6);
    v_new_cost_basis NUMERIC(20, 6);
    v_new_avg_cost NUMERIC(20, 6);
    v_realized_pnl NUMERIC(20, 6);
    v_currency_balance NUMERIC(20, 6);
BEGIN
    IF NEW.status != 'SUCCESS' THEN
        RETURN NEW;
    END IF;

    -- ===================================
    -- HANDLE STOCK TRANSACTIONS (BUY/SELL)
    -- ===================================
    IF NEW.transaction_type IN ('BUY', 'SELL') THEN
        SELECT * INTO v_position
        FROM portfolio_positions
        WHERE user_id = NEW.user_id AND stock_symbol = NEW.stock_symbol;

        IF NEW.transaction_type = 'BUY' THEN
            -- Validate sufficient currency balance
            SELECT balance INTO v_currency_balance
            FROM currency_balances
            WHERE user_id = NEW.user_id AND currency_symbol = NEW.base_currency;

            IF v_currency_balance IS NULL OR v_currency_balance < (NEW.total_value + NEW.fee_amount) THEN
                RAISE EXCEPTION 'Insufficient currency balance. Have: %, Need: %',
                    COALESCE(v_currency_balance, 0), (NEW.total_value + NEW.fee_amount);
            END IF;

            -- Calculate new values for BUY
            v_new_quantity := COALESCE(v_position.current_quantity, 0) + NEW.quantity;
            v_new_cost_basis := COALESCE(v_position.total_cost_basis, 0) + NEW.total_value + NEW.fee_amount;
            v_new_avg_cost := v_new_cost_basis / v_new_quantity;

            -- Upsert portfolio position
            INSERT INTO portfolio_positions (
                user_id,
                stock_symbol,
                current_quantity,
                total_cost_basis,
                average_cost_per_share,
                realized_profit_loss,
                last_updated
            )
            VALUES (
                NEW.user_id,
                NEW.stock_symbol,
                v_new_quantity,
                v_new_cost_basis,
                v_new_avg_cost,
                COALESCE(v_position.realized_profit_loss, 0),
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (user_id, stock_symbol)
            DO UPDATE SET
                current_quantity = v_new_quantity,
                total_cost_basis = v_new_cost_basis,
                average_cost_per_share = v_new_avg_cost,
                last_updated = CURRENT_TIMESTAMP;

            -- Update currency balance
            UPDATE currency_balances
            SET balance = balance - (NEW.total_value + NEW.fee_amount),
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = NEW.user_id AND currency_symbol = NEW.base_currency;

        ELSIF NEW.transaction_type = 'SELL' THEN
            -- Validate sufficient stock balance
            IF v_position IS NULL OR v_position.current_quantity < NEW.quantity THEN
                RAISE EXCEPTION 'Insufficient stock balance. Have: %, Trying to sell: %',
                    COALESCE(v_position.current_quantity, 0), NEW.quantity;
            END IF;

            -- Calculate realized P&L
            v_realized_pnl := NEW.total_value - (v_position.average_cost_per_share * NEW.quantity);
            NEW.realized_pnl := v_realized_pnl;

            -- Calculate new values for SELL
            v_new_quantity := v_position.current_quantity - NEW.quantity;
            v_new_cost_basis := v_position.total_cost_basis - (v_position.average_cost_per_share * NEW.quantity);

            -- Update portfolio position
            UPDATE portfolio_positions
            SET current_quantity = v_new_quantity,
                total_cost_basis = GREATEST(0, v_new_cost_basis),
                realized_profit_loss = realized_profit_loss + v_realized_pnl,
                last_updated = CURRENT_TIMESTAMP
            WHERE user_id = NEW.user_id AND stock_symbol = NEW.stock_symbol;

            -- Update currency balance
            UPDATE currency_balances
            SET balance = balance + NEW.total_value,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = NEW.user_id AND currency_symbol = NEW.base_currency;
        END IF;

    -- ===================================
    -- HANDLE CURRENCY TRANSACTIONS (MINT/BURN)
    -- ===================================
    ELSIF NEW.transaction_type IN ('MINT', 'BURN') THEN
        SELECT balance INTO v_currency_balance
        FROM currency_balances
        WHERE user_id = NEW.user_id AND currency_symbol = NEW.currency_symbol;

        IF NEW.transaction_type = 'MINT' THEN
            INSERT INTO currency_balances (user_id, currency_symbol, balance, updated_at)
            VALUES (NEW.user_id, NEW.currency_symbol, NEW.quantity, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, currency_symbol)
            DO UPDATE SET
                balance = currency_balances.balance + NEW.quantity,
                updated_at = CURRENT_TIMESTAMP;

        ELSIF NEW.transaction_type = 'BURN' THEN
            IF v_currency_balance IS NULL OR v_currency_balance < NEW.quantity THEN
                RAISE EXCEPTION 'Insufficient currency balance. Have: %, Trying to burn: %',
                    COALESCE(v_currency_balance, 0), NEW.quantity;
            END IF;

            UPDATE currency_balances
            SET balance = balance - NEW.quantity,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = NEW.user_id AND currency_symbol = NEW.currency_symbol;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION process_transaction_trigger IS 'Automatically updates portfolio when transactions are inserted';

-- =====================================================
-- 7. CREATE TRIGGER
-- =====================================================
CREATE TRIGGER transaction_trigger
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION process_transaction_trigger();

-- =====================================================
-- GRANT PERMISSIONS TO ssa_admin
-- =====================================================
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ssa_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ssa_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO ssa_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ssa_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ssa_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO ssa_admin;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Database initialization complete!' as status;
