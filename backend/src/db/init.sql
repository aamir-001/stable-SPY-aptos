-- SSA Exchange Database Schema
-- This file runs automatically when PostgreSQL container starts for the first time

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (track wallet addresses)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(66) UNIQUE NOT NULL,
    base_currency VARCHAR(3) DEFAULT 'INR',  -- User's preferred currency (INR, EUR, CNY)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);

-- Transactions table (track all buy/sell/mint operations)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(66) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('BUY', 'SELL', 'MINT')),
    stock_symbol VARCHAR(10),
    currency_symbol VARCHAR(10),
    quantity DECIMAL(20, 6) NOT NULL,  -- Number of stocks bought/sold
    price_per_share DECIMAL(20, 6),    -- Price per stock at transaction time
    total_value DECIMAL(20, 6) NOT NULL,  -- Total INR/EUR/CNY spent/received
    realized_pnl DECIMAL(20, 6),       -- Profit/loss for SELL transactions (NULL for BUY)
    base_currency VARCHAR(3) NOT NULL, -- Currency used (INR, EUR, CNY)
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_address ON transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_stock_symbol ON transactions(stock_symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Portfolio positions table (stock holdings with cost basis for P&L tracking)
CREATE TABLE IF NOT EXISTS portfolio_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(66) NOT NULL,
    stock_symbol VARCHAR(10) NOT NULL,

    -- Current holdings
    current_quantity DECIMAL(20, 6) NOT NULL DEFAULT 0,

    -- Cost basis tracking (in user's base currency)
    total_cost_basis DECIMAL(20, 6) NOT NULL DEFAULT 0,     -- Total invested
    average_cost_per_share DECIMAL(20, 6) NOT NULL DEFAULT 0, -- Average buy price

    -- Realized gains (from sells)
    realized_profit_loss DECIMAL(20, 6) DEFAULT 0,  -- Total profit/loss from sold positions

    -- Metadata
    base_currency VARCHAR(3) NOT NULL,  -- INR, EUR, CNY
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(wallet_address, stock_symbol)
);

-- Create indexes for portfolio lookups
CREATE INDEX IF NOT EXISTS idx_portfolio_positions_wallet_address ON portfolio_positions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_portfolio_positions_stock_symbol ON portfolio_positions(stock_symbol);

-- Stock price history table (cache historical prices)
CREATE TABLE IF NOT EXISTS stock_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(10) NOT NULL,
    price_usd DECIMAL(20, 6) NOT NULL,
    price_inr DECIMAL(20, 6) NOT NULL,
    change_percent DECIMAL(10, 4),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for price lookups
CREATE INDEX IF NOT EXISTS idx_stock_prices_symbol ON stock_prices(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_prices_timestamp ON stock_prices(timestamp DESC);

-- Analytics table (track trading volumes and statistics)
CREATE TABLE IF NOT EXISTS trading_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    stock_symbol VARCHAR(10) NOT NULL,
    total_buy_volume DECIMAL(20, 6) DEFAULT 0,
    total_sell_volume DECIMAL(20, 6) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    unique_traders INTEGER DEFAULT 0,
    UNIQUE(date, stock_symbol)
);

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_date ON trading_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_symbol ON trading_analytics(stock_symbol);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update users.updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to upsert user (get or create)
CREATE OR REPLACE FUNCTION upsert_user(p_wallet_address VARCHAR)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    INSERT INTO users (wallet_address)
    VALUES (p_wallet_address)
    ON CONFLICT (wallet_address)
    DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_user_id;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Insert initial data (optional)
-- Uncomment to pre-populate with stock symbols
/*
INSERT INTO stock_prices (symbol, price_usd, price_inr, change_percent) VALUES
    ('GOOG', 165.50, 14895.00, 1.41),
    ('AAPL', 225.00, 20250.00, -0.66),
    ('TSLA', 350.75, 31567.50, 1.48),
    ('NVDA', 140.25, 12622.50, 8.91),
    ('HOOD', 28.50, 2565.00, 1.05)
ON CONFLICT DO NOTHING;
*/

-- Grant permissions (if needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ssa_admin;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ssa_admin;
