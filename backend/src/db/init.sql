-- =============================================================================
-- SSA EXCHANGE DATABASE SCHEMA (Production-Ready with Triggers)
-- Supports fractional token ownership
-- Automatic portfolio updates via triggers
-- Weighted Average Cost Basis algorithm
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Users table (single source of truth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(66) UNIQUE NOT NULL,
    base_currency VARCHAR(3) DEFAULT 'INR' CHECK (base_currency IN ('INR', 'EUR', 'CNY')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_wallet_address ON users(wallet_address);

COMMENT ON TABLE users IS 'User accounts with wallet addresses and preferences';
COMMENT ON COLUMN users.base_currency IS 'User preferred currency for P&L calculations';

-- Transactions table (all operations)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('BUY', 'SELL', 'MINT', 'BURN')),
    
    -- Asset details
    stock_symbol VARCHAR(10),           -- For BUY/SELL
    currency_symbol VARCHAR(10),        -- For MINT/BURN
    
    -- Transaction amounts (supports fractional)
    quantity DECIMAL(30, 6) NOT NULL,           -- Fractional quantities allowed
    price_per_unit DECIMAL(30, 6),              -- NULL for MINT/BURN
    total_value DECIMAL(30, 6) NOT NULL,        -- Total transaction value
    realized_pnl DECIMAL(30, 6),                -- Calculated by trigger for SELL
    
    -- Blockchain reference
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING')),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_stock_or_currency CHECK (
        (transaction_type IN ('BUY', 'SELL') AND stock_symbol IS NOT NULL AND price_per_unit IS NOT NULL) OR
        (transaction_type IN ('MINT', 'BURN') AND currency_symbol IS NOT NULL)
    )
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_stock_symbol ON transactions(stock_symbol);
CREATE INDEX idx_transactions_currency_symbol ON transactions(currency_symbol);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_user_stock ON transactions(user_id, stock_symbol);

COMMENT ON TABLE transactions IS 'All trading and currency operations (BUY/SELL/MINT/BURN)';
COMMENT ON COLUMN transactions.quantity IS 'Supports fractional quantities (e.g., 0.5 stocks)';
COMMENT ON COLUMN transactions.realized_pnl IS 'Automatically calculated by trigger for SELL transactions';

-- Portfolio positions table (fractional ownership supported)
CREATE TABLE IF NOT EXISTS portfolio_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stock_symbol VARCHAR(10) NOT NULL,

    -- Current holdings (fractional allowed)
    current_quantity DECIMAL(30, 6) NOT NULL DEFAULT 0,

    -- Cost basis tracking (Weighted Average)
    total_cost_basis DECIMAL(30, 6) NOT NULL DEFAULT 0,         -- Total amount invested
    average_cost_per_share DECIMAL(30, 6) NOT NULL DEFAULT 0,   -- Weighted average price

    -- Realized gains tracking
    realized_profit_loss DECIMAL(30, 6) DEFAULT 0,              -- Cumulative realized P&L

    -- Metadata
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, stock_symbol)
);

CREATE INDEX idx_portfolio_positions_user_id ON portfolio_positions(user_id);
CREATE INDEX idx_portfolio_positions_stock_symbol ON portfolio_positions(stock_symbol);
CREATE INDEX idx_portfolio_positions_user_stock ON portfolio_positions(user_id, stock_symbol);

COMMENT ON TABLE portfolio_positions IS 'User stock holdings with cost basis (supports fractional ownership)';
COMMENT ON COLUMN portfolio_positions.average_cost_per_share IS 'Weighted average cost using FIFO-like algorithm';

-- Currency balances table (fractional allowed)
CREATE TABLE IF NOT EXISTS currency_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency_symbol VARCHAR(3) NOT NULL CHECK (currency_symbol IN ('INR', 'EUR', 'CNY')),
    balance DECIMAL(30, 6) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, currency_symbol)
);

CREATE INDEX idx_currency_balances_user_id ON currency_balances(user_id);
CREATE INDEX idx_currency_balances_user_currency ON currency_balances(user_id, currency_symbol);

COMMENT ON TABLE currency_balances IS 'User currency holdings (INR, EUR, CNY)';

-- =============================================================================
-- TRIGGER FUNCTIONS (Automatic Portfolio Updates)
-- =============================================================================

-- Trigger function: Update portfolio after transaction insert
CREATE OR REPLACE FUNCTION process_transaction_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_current_quantity DECIMAL(30, 6);
    v_current_cost_basis DECIMAL(30, 6);
    v_avg_cost DECIMAL(30, 6);
    v_new_quantity DECIMAL(30, 6);
    v_new_cost_basis DECIMAL(30, 6);
    v_new_avg_cost DECIMAL(30, 6);
    v_cost_basis_sold DECIMAL(30, 6);
    v_realized_pnl DECIMAL(30, 6);
BEGIN
    -- Only process successful transactions
    IF NEW.status != 'SUCCESS' THEN
        RETURN NEW;
    END IF;

    -- =================================================================
    -- HANDLE BUY TRANSACTIONS (Weighted Average Cost)
    -- =================================================================
    IF NEW.transaction_type = 'BUY' THEN
        -- Get current position
        SELECT current_quantity, total_cost_basis, average_cost_per_share
        INTO v_current_quantity, v_current_cost_basis, v_avg_cost
        FROM portfolio_positions
        WHERE user_id = NEW.user_id AND stock_symbol = NEW.stock_symbol;

        -- Calculate new weighted average
        -- Formula: New Avg = (Old Cost + New Cost) / (Old Qty + New Qty)
        v_new_quantity := COALESCE(v_current_quantity, 0) + NEW.quantity;
        v_new_cost_basis := COALESCE(v_current_cost_basis, 0) + NEW.total_value;
        v_new_avg_cost := v_new_cost_basis / v_new_quantity;

        -- Upsert portfolio position
        INSERT INTO portfolio_positions (
            user_id, 
            stock_symbol, 
            current_quantity, 
            total_cost_basis, 
            average_cost_per_share
        )
        VALUES (
            NEW.user_id, 
            NEW.stock_symbol, 
            v_new_quantity, 
            v_new_cost_basis, 
            v_new_avg_cost
        )
        ON CONFLICT (user_id, stock_symbol)
        DO UPDATE SET
            current_quantity = v_new_quantity,
            total_cost_basis = v_new_cost_basis,
            average_cost_per_share = v_new_avg_cost,
            last_updated = CURRENT_TIMESTAMP;

        RAISE NOTICE 'BUY: User % bought % units of % @ % (Avg cost now: %)', 
            NEW.user_id, NEW.quantity, NEW.stock_symbol, NEW.price_per_unit, v_new_avg_cost;

    -- =================================================================
    -- HANDLE SELL TRANSACTIONS (Calculate Realized P&L)
    -- =================================================================
    ELSIF NEW.transaction_type = 'SELL' THEN
        -- Get current position
        SELECT current_quantity, total_cost_basis, average_cost_per_share
        INTO v_current_quantity, v_current_cost_basis, v_avg_cost
        FROM portfolio_positions
        WHERE user_id = NEW.user_id AND stock_symbol = NEW.stock_symbol;

        -- Validate sufficient quantity
        IF v_current_quantity IS NULL OR v_current_quantity < NEW.quantity THEN
            RAISE EXCEPTION 'Insufficient stock balance. Have: %, Trying to sell: %', 
                COALESCE(v_current_quantity, 0), NEW.quantity;
        END IF;

        -- Calculate realized P&L
        -- Formula: P&L = Sale Proceeds - (Avg Cost × Qty Sold)
        v_cost_basis_sold := v_avg_cost * NEW.quantity;
        v_realized_pnl := NEW.total_value - v_cost_basis_sold;

        -- Update the transaction record with calculated P&L
        NEW.realized_pnl := v_realized_pnl;

        -- Calculate remaining position
        v_new_quantity := v_current_quantity - NEW.quantity;
        v_new_cost_basis := v_current_cost_basis - v_cost_basis_sold;

        -- Update portfolio
        UPDATE portfolio_positions
        SET
            current_quantity = v_new_quantity,
            total_cost_basis = v_new_cost_basis,
            -- Average cost per share remains the same (weighted average doesn't change on sell)
            realized_profit_loss = COALESCE(realized_profit_loss, 0) + v_realized_pnl,
            last_updated = CURRENT_TIMESTAMP
        WHERE user_id = NEW.user_id AND stock_symbol = NEW.stock_symbol;

        -- If position fully closed, keep record for history (don't delete)
        IF v_new_quantity <= 0.000001 THEN
            UPDATE portfolio_positions
            SET current_quantity = 0, total_cost_basis = 0
            WHERE user_id = NEW.user_id AND stock_symbol = NEW.stock_symbol;
        END IF;

        RAISE NOTICE 'SELL: User % sold % units of % @ % (Cost basis: %, P&L: %)', 
            NEW.user_id, NEW.quantity, NEW.stock_symbol, NEW.price_per_unit, v_cost_basis_sold, v_realized_pnl;

    -- =================================================================
    -- HANDLE CURRENCY TRANSACTIONS (MINT/BURN)
    -- =================================================================
    ELSIF NEW.transaction_type = 'MINT' THEN
        -- Add currency to balance
        INSERT INTO currency_balances (user_id, currency_symbol, balance)
        VALUES (NEW.user_id, NEW.currency_symbol, NEW.quantity)
        ON CONFLICT (user_id, currency_symbol)
        DO UPDATE SET
            balance = currency_balances.balance + NEW.quantity,
            last_updated = CURRENT_TIMESTAMP;

        RAISE NOTICE 'MINT: User % received % %', NEW.user_id, NEW.quantity, NEW.currency_symbol;

    ELSIF NEW.transaction_type = 'BURN' THEN
        -- Remove currency from balance
        INSERT INTO currency_balances (user_id, currency_symbol, balance)
        VALUES (NEW.user_id, NEW.currency_symbol, -NEW.quantity)
        ON CONFLICT (user_id, currency_symbol)
        DO UPDATE SET
            balance = currency_balances.balance - NEW.quantity,
            last_updated = CURRENT_TIMESTAMP;

        RAISE NOTICE 'BURN: User % burned % %', NEW.user_id, NEW.quantity, NEW.currency_symbol;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_update_portfolio ON transactions;

CREATE TRIGGER trg_update_portfolio
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION process_transaction_trigger();

COMMENT ON FUNCTION process_transaction_trigger IS 'Automatically updates portfolio and currency balances when transactions are inserted';

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get or create user
CREATE OR REPLACE FUNCTION upsert_user(p_wallet_address VARCHAR, p_base_currency VARCHAR DEFAULT 'INR')
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    INSERT INTO users (wallet_address, base_currency)
    VALUES (p_wallet_address, p_base_currency)
    ON CONFLICT (wallet_address)
    DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_user_id;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION upsert_user IS 'Creates user if not exists, returns user_id';

-- Get user by wallet address
CREATE OR REPLACE FUNCTION get_user_by_wallet(p_wallet_address VARCHAR)
RETURNS TABLE (
    user_id UUID,
    wallet_address VARCHAR,
    base_currency VARCHAR,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT id, users.wallet_address, users.base_currency, users.created_at, users.updated_at
    FROM users
    WHERE users.wallet_address = p_wallet_address;
END;
$$ LANGUAGE plpgsql;

-- Get user portfolio with current positions
CREATE OR REPLACE FUNCTION get_user_portfolio(p_user_id UUID)
RETURNS TABLE (
    stock_symbol VARCHAR,
    current_quantity DECIMAL,
    average_cost_per_share DECIMAL,
    total_cost_basis DECIMAL,
    realized_profit_loss DECIMAL,
    last_updated TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.stock_symbol,
        pp.current_quantity,
        pp.average_cost_per_share,
        pp.total_cost_basis,
        pp.realized_profit_loss,
        pp.last_updated
    FROM portfolio_positions pp
    WHERE pp.user_id = p_user_id AND pp.current_quantity > 0
    ORDER BY pp.stock_symbol;
END;
$$ LANGUAGE plpgsql;

-- Get user currency balances
CREATE OR REPLACE FUNCTION get_user_balances(p_user_id UUID)
RETURNS TABLE (
    currency_symbol VARCHAR,
    balance DECIMAL,
    last_updated TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cb.currency_symbol,
        cb.balance,
        cb.last_updated
    FROM currency_balances cb
    WHERE cb.user_id = p_user_id
    ORDER BY cb.currency_symbol;
END;
$$ LANGUAGE plpgsql;

-- Get user transaction history with pagination
CREATE OR REPLACE FUNCTION get_user_transactions(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    transaction_type VARCHAR,
    stock_symbol VARCHAR,
    currency_symbol VARCHAR,
    quantity DECIMAL,
    price_per_unit DECIMAL,
    total_value DECIMAL,
    realized_pnl DECIMAL,
    tx_hash VARCHAR,
    status VARCHAR,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.transaction_type,
        t.stock_symbol,
        t.currency_symbol,
        t.quantity,
        t.price_per_unit,
        t.total_value,
        t.realized_pnl,
        t.tx_hash,
        t.status,
        t.created_at
    FROM transactions t
    WHERE t.user_id = p_user_id
    ORDER BY t.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Calculate unrealized P&L (requires current prices)
CREATE OR REPLACE FUNCTION calculate_unrealized_pnl(
    p_user_id UUID,
    p_current_prices JSONB  -- Format: {"NVDA": 17115.30, "AAPL": 20250.00}
)
RETURNS TABLE (
    stock_symbol VARCHAR,
    current_quantity DECIMAL,
    average_cost DECIMAL,
    current_price DECIMAL,
    cost_basis DECIMAL,
    market_value DECIMAL,
    unrealized_pnl DECIMAL,
    unrealized_pnl_percent DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.stock_symbol,
        pp.current_quantity,
        pp.average_cost_per_share,
        (p_current_prices->>pp.stock_symbol)::DECIMAL AS current_price,
        pp.total_cost_basis,
        pp.current_quantity * (p_current_prices->>pp.stock_symbol)::DECIMAL AS market_value,
        (pp.current_quantity * (p_current_prices->>pp.stock_symbol)::DECIMAL) - pp.total_cost_basis AS unrealized_pnl,
        (((pp.current_quantity * (p_current_prices->>pp.stock_symbol)::DECIMAL) - pp.total_cost_basis) / pp.total_cost_basis * 100) AS unrealized_pnl_percent
    FROM portfolio_positions pp
    WHERE pp.user_id = p_user_id 
      AND pp.current_quantity > 0
      AND p_current_prices ? pp.stock_symbol;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_unrealized_pnl IS 'Calculate unrealized P&L given current market prices';

-- =============================================================================
-- AUTO-UPDATE TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Note: portfolio_positions and currency_balances are updated by the main trigger

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Complete portfolio view
CREATE OR REPLACE VIEW v_user_portfolio AS
SELECT
    u.id AS user_id,
    u.wallet_address,
    u.base_currency,
    pp.stock_symbol,
    pp.current_quantity,
    pp.average_cost_per_share,
    pp.total_cost_basis,
    pp.realized_profit_loss,
    pp.last_updated
FROM users u
JOIN portfolio_positions pp ON u.id = pp.user_id
WHERE pp.current_quantity > 0;

-- Transaction history view
CREATE OR REPLACE VIEW v_user_transactions AS
SELECT
    t.id,
    u.wallet_address,
    u.base_currency,
    t.transaction_type,
    t.stock_symbol,
    t.currency_symbol,
    t.quantity,
    t.price_per_unit,
    t.total_value,
    t.realized_pnl,
    t.tx_hash,
    t.status,
    t.created_at
FROM transactions t
JOIN users u ON t.user_id = u.id
ORDER BY t.created_at DESC;

-- Currency balances view
CREATE OR REPLACE VIEW v_user_balances AS
SELECT
    u.id AS user_id,
    u.wallet_address,
    cb.currency_symbol,
    cb.balance,
    cb.last_updated
FROM users u
JOIN currency_balances cb ON u.id = cb.user_id;

-- =============================================================================
-- EXAMPLE USAGE
-- =============================================================================

/*
-- 1. Create/Get User
SELECT upsert_user('0xebb91a4b81d7df2f2994095f2c6242096bbd4c18d78df312de70ddb8f25779a9', 'INR');

-- 2. Insert BUY transaction (trigger automatically updates portfolio)
INSERT INTO transactions (
    user_id, transaction_type, stock_symbol,
    quantity, price_per_unit, total_value, tx_hash, status
) VALUES (
    'user-uuid-here',
    'BUY',
    'NVDA',
    0.876576,           -- Fractional quantity!
    17115.30,
    15000.00,
    '0xabc123...',
    'SUCCESS'
);
-- Portfolio automatically updated with weighted average cost!

-- 3. Insert SELL transaction (trigger calculates P&L)
INSERT INTO transactions (
    user_id, transaction_type, stock_symbol,
    quantity, price_per_unit, total_value, tx_hash, status
) VALUES (
    'user-uuid-here',
    'SELL',
    'NVDA',
    0.5,
    18000.00,
    9000.00,
    '0xdef456...',
    'SUCCESS'
);
-- Realized P&L automatically calculated and stored!

-- 4. Get portfolio
SELECT * FROM get_user_portfolio('user-uuid-here');

-- 5. Get transaction history
SELECT * FROM get_user_transactions('user-uuid-here', 20, 0);

-- 6. Calculate unrealized P&L
SELECT * FROM calculate_unrealized_pnl(
    'user-uuid-here',
    '{"NVDA": 19000.00, "AAPL": 21000.00}'::jsonb
);
*/