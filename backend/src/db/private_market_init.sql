-- =====================================================
-- Private Market Database Initialization Script
-- StableSPY - Private Stock Trading (USDC-based)
-- Supports Stripe, OpenAI, Databricks, SpaceX tokens
-- =====================================================

-- Drop existing objects (in reverse dependency order)
DROP TRIGGER IF EXISTS private_transaction_trigger ON private_market_transactions;
DROP FUNCTION IF EXISTS process_private_transaction_trigger CASCADE;
DROP TABLE IF EXISTS private_market_transactions CASCADE;
DROP TABLE IF EXISTS private_market_portfolio CASCADE;

-- =====================================================
-- 1. PRIVATE MARKET PORTFOLIO TABLE
-- =====================================================
CREATE TABLE private_market_portfolio (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stock_symbol VARCHAR(20) NOT NULL,
    current_quantity NUMERIC(20, 6) DEFAULT 0 NOT NULL,
    total_cost_basis NUMERIC(20, 6) DEFAULT 0 NOT NULL,
    average_cost_per_share NUMERIC(20, 6) DEFAULT 0 NOT NULL,
    realized_profit_loss NUMERIC(20, 6) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, stock_symbol)
);

CREATE INDEX idx_private_portfolio_user ON private_market_portfolio(user_id);
CREATE INDEX idx_private_portfolio_stock ON private_market_portfolio(stock_symbol);
CREATE INDEX idx_private_portfolio_user_stock ON private_market_portfolio(user_id, stock_symbol);

COMMENT ON TABLE private_market_portfolio IS 'User private market stock holdings (USDC-based)';
COMMENT ON COLUMN private_market_portfolio.total_cost_basis IS 'Total USDC invested including fees';

-- =====================================================
-- 2. PRIVATE MARKET TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE private_market_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stock_symbol VARCHAR(20) NOT NULL,
    transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('BUY', 'SELL')),
    quantity NUMERIC(20, 6) NOT NULL,
    price_per_share NUMERIC(20, 6) NOT NULL,
    total_value NUMERIC(20, 6) NOT NULL,
    fee_amount NUMERIC(20, 6) DEFAULT 0 NOT NULL,
    realized_pnl NUMERIC(20, 6),
    usdc_tx_hash VARCHAR(66),
    token_tx_hash VARCHAR(66) NOT NULL,
    status VARCHAR(20) DEFAULT 'SUCCESS' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_private_tx_user ON private_market_transactions(user_id);
CREATE INDEX idx_private_tx_stock ON private_market_transactions(stock_symbol);
CREATE INDEX idx_private_tx_type ON private_market_transactions(transaction_type);
CREATE INDEX idx_private_tx_created ON private_market_transactions(created_at DESC);
CREATE INDEX idx_private_tx_user_stock ON private_market_transactions(user_id, stock_symbol);

COMMENT ON TABLE private_market_transactions IS 'Private market trading operations (USDC-based)';
COMMENT ON COLUMN private_market_transactions.total_value IS 'USDC amount (EXCLUDING fees for display)';
COMMENT ON COLUMN private_market_transactions.fee_amount IS '0.1% transaction fee in USDC';
COMMENT ON COLUMN private_market_transactions.usdc_tx_hash IS 'USDC transfer transaction hash';
COMMENT ON COLUMN private_market_transactions.token_tx_hash IS 'Stock token mint/burn transaction hash';

-- =====================================================
-- 3. PRIVATE TRANSACTION TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION process_private_transaction_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_position RECORD;
    v_new_quantity NUMERIC(20, 6);
    v_new_cost_basis NUMERIC(20, 6);
    v_new_avg_cost NUMERIC(20, 6);
    v_realized_pnl NUMERIC(20, 6);
BEGIN
    IF NEW.status != 'SUCCESS' THEN
        RETURN NEW;
    END IF;

    SELECT * INTO v_position
    FROM private_market_portfolio
    WHERE user_id = NEW.user_id AND stock_symbol = NEW.stock_symbol;

    IF NEW.transaction_type = 'BUY' THEN
        -- Calculate new values for BUY
        v_new_quantity := COALESCE(v_position.current_quantity, 0) + NEW.quantity;
        v_new_cost_basis := COALESCE(v_position.total_cost_basis, 0) + NEW.total_value + NEW.fee_amount;
        v_new_avg_cost := v_new_cost_basis / v_new_quantity;

        -- Upsert portfolio position
        INSERT INTO private_market_portfolio (
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
        UPDATE private_market_portfolio
        SET current_quantity = v_new_quantity,
            total_cost_basis = GREATEST(0, v_new_cost_basis),
            realized_profit_loss = realized_profit_loss + v_realized_pnl,
            last_updated = CURRENT_TIMESTAMP
        WHERE user_id = NEW.user_id AND stock_symbol = NEW.stock_symbol;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION process_private_transaction_trigger IS 'Automatically updates private market portfolio when transactions are inserted';

-- =====================================================
-- 4. CREATE TRIGGER
-- =====================================================
CREATE TRIGGER private_transaction_trigger
    BEFORE INSERT ON private_market_transactions
    FOR EACH ROW
    EXECUTE FUNCTION process_private_transaction_trigger();

-- =====================================================
-- GRANT PERMISSIONS TO ssa_admin
-- =====================================================
GRANT ALL PRIVILEGES ON private_market_portfolio TO ssa_admin;
GRANT ALL PRIVILEGES ON private_market_transactions TO ssa_admin;
GRANT ALL PRIVILEGES ON private_market_portfolio_id_seq TO ssa_admin;
GRANT ALL PRIVILEGES ON private_market_transactions_id_seq TO ssa_admin;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Private market database initialization complete!' as status;
