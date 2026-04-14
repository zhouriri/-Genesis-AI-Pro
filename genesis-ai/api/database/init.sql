-- ============================================
-- Genesis AI 数据库初始化脚本
-- PostgreSQL + TimescaleDB
-- ============================================

-- 启用 TimescaleDB 扩展（如果已安装）
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ============================================
-- 用户相关表
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    email VARCHAR(255),
    telegram_id VARCHAR(50),
    discord_id VARCHAR(50),
    risk_profile VARCHAR(20) DEFAULT 'balanced' CHECK (risk_profile IN ('conservative', 'balanced', 'aggressive')),
    strategy_type VARCHAR(20) DEFAULT 'balanced' CHECK (strategy_type IN ('conservative', 'balanced', 'aggressive', 'custom')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    country_code VARCHAR(3),
    nationality_declared VARCHAR(3),
    is_blocked BOOLEAN DEFAULT false,
    block_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country_code);

-- 用户 Session Keys 表
CREATE TABLE IF NOT EXISTS user_session_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(66) UNIQUE NOT NULL,
    ai_agent_address VARCHAR(42) NOT NULL,
    max_amount DECIMAL(36, 6) NOT NULL,
    daily_limit DECIMAL(36, 6) NOT NULL,
    spent_amount DECIMAL(36, 6) DEFAULT 0,
    spent_today DECIMAL(36, 6) DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    is_long_term BOOLEAN DEFAULT false,
    is_revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_user ON user_session_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_session_validity ON user_session_keys(valid_until) WHERE NOT is_revoked;

-- ============================================
-- 交易与仓位表
-- ============================================

-- 仓位表
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    position_id VARCHAR(66) UNIQUE NOT NULL,
    asset_symbol VARCHAR(20) NOT NULL,
    asset_address VARCHAR(42) NOT NULL,
    side VARCHAR(5) NOT NULL CHECK (side IN ('long', 'short')),
    entry_price DECIMAL(36, 18) NOT NULL,
    current_price DECIMAL(36, 18),
    size DECIMAL(36, 18) NOT NULL,
    collateral DECIMAL(36, 6) NOT NULL,
    leverage DECIMAL(5, 2) NOT NULL,
    unrealized_pnl DECIMAL(36, 6) DEFAULT 0,
    realized_pnl DECIMAL(36, 6) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'liquidated')),
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by VARCHAR(20),
    closed_reason TEXT,
    stop_loss_price DECIMAL(36, 18),
    take_profit_price DECIMAL(36, 18),
    strategy_type VARCHAR(20),
    transaction_hash VARCHAR(66),
    CONSTRAINT positive_leverage CHECK (leverage > 0)
);

CREATE INDEX IF NOT EXISTS idx_positions_user ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_asset ON positions(asset_symbol);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_positions_opened ON positions(opened_at DESC);

-- 交易历史表
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    position_id UUID REFERENCES positions(id),
    trade_type VARCHAR(10) NOT NULL CHECK (trade_type IN ('open', 'close', 'add', 'reduce')),
    asset_symbol VARCHAR(20) NOT NULL,
    side VARCHAR(5) NOT NULL,
    price DECIMAL(36, 18) NOT NULL,
    size DECIMAL(36, 18) NOT NULL,
    volume DECIMAL(36, 6) NOT NULL,
    fee DECIMAL(36, 6) NOT NULL,
    slippage DECIMAL(5, 4) DEFAULT 0,
    executed_by VARCHAR(20) NOT NULL CHECK (executed_by IN ('user', 'ai')),
    strategy_type VARCHAR(20),
    transaction_hash VARCHAR(66),
    block_number BIGINT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_position ON trades(position_id);
CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON trades(timestamp DESC);

-- 充值记录
CREATE TABLE IF NOT EXISTS deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(36, 6) NOT NULL,
    amount_usd DECIMAL(36, 6) NOT NULL,
    chain VARCHAR(20) NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 提现记录
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(36, 6) NOT NULL,
    amount_usd DECIMAL(36, 6) NOT NULL,
    fee DECIMAL(36, 6) NOT NULL,
    chain VARCHAR(20) NOT NULL,
    destination_address VARCHAR(42) NOT NULL,
    transaction_hash VARCHAR(66),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'confirmed', 'rejected', 'failed')),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AI 策略相关表
-- ============================================

-- 用户策略配置
CREATE TABLE IF NOT EXISTS user_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    strategy_type VARCHAR(20) NOT NULL CHECK (strategy_type IN ('conservative', 'balanced', 'aggressive', 'custom')),
    is_active BOOLEAN DEFAULT true,
    custom_params JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 策略信号历史
CREATE TABLE IF NOT EXISTS strategy_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    asset_symbol VARCHAR(20) NOT NULL,
    signal_type VARCHAR(10) NOT NULL CHECK (signal_type IN ('buy', 'sell', 'hold', 'reduce')),
    confidence DECIMAL(5, 4) NOT NULL,
    target_weight DECIMAL(5, 4),
    urgency VARCHAR(10),
    reason TEXT,
    signal_sources JSONB,
    executed BOOLEAN DEFAULT false,
    execution_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signals_user ON strategy_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_signals_asset ON strategy_signals(asset_symbol);
CREATE INDEX IF NOT EXISTS idx_signals_created ON strategy_signals(created_at DESC);

-- ============================================
-- 合规与审计表
-- ============================================

-- 用户活动日志
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    action_details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- ============================================
-- 通知表
-- ============================================

-- 用户通知
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('telegram', 'discord', 'email', 'in_app')),
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE NOT is_read;

-- ============================================
-- TimescaleDB 时序表
-- ============================================

-- 价格数据 (高频)
CREATE TABLE IF NOT EXISTS price_data (
    time TIMESTAMPTZ NOT NULL,
    asset_symbol VARCHAR(20) NOT NULL,
    source VARCHAR(20) NOT NULL CHECK (source IN ('pyth', 'coinbase', 'binance', 'jupiter')),
    price DECIMAL(36, 18) NOT NULL,
    PRIMARY KEY (time, asset_symbol, source)
);

SELECT create_hypertable('price_data', 'time', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_price_symbol ON price_data(asset_symbol, time DESC);

-- 仓位快照 (每小时)
CREATE TABLE IF NOT EXISTS position_snapshots (
    time TIMESTAMPTZ NOT NULL,
    user_id UUID NOT NULL,
    position_id VARCHAR(66) NOT NULL,
    asset_symbol VARCHAR(20) NOT NULL,
    pnl DECIMAL(36, 6) NOT NULL,
    price DECIMAL(36, 18) NOT NULL,
    size DECIMAL(36, 18) NOT NULL,
    collateral DECIMAL(36, 6) NOT NULL,
    unrealized_pnl_pct DECIMAL(10, 4)
);

SELECT create_hypertable('position_snapshots', 'time', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_snapshot_position ON position_snapshots(position_id, time DESC);

-- 策略性能追踪
CREATE TABLE IF NOT EXISTS strategy_performance (
    time TIMESTAMPTZ NOT NULL,
    user_id UUID NOT NULL,
    strategy_type VARCHAR(20) NOT NULL,
    total_pnl DECIMAL(36, 6) NOT NULL,
    total_return_pct DECIMAL(10, 4) NOT NULL,
    sharpe_ratio DECIMAL(10, 4),
    max_drawdown_pct DECIMAL(10, 4),
    win_rate DECIMAL(5, 4),
    trade_count INTEGER
);

SELECT create_hypertable('strategy_performance', 'time', if_not_exists => TRUE);

-- ============================================
-- 初始化数据
-- ============================================

-- 插入默认策略配置（可选）
-- INSERT INTO user_strategies (user_id, strategy_type, is_active, custom_params) VALUES ...

COMMENT ON TABLE users IS '用户信息表';
COMMENT ON TABLE user_session_keys IS '用户 Session Keys 表';
COMMENT ON TABLE positions IS '用户仓位表';
COMMENT ON TABLE trades IS '交易历史表';
COMMENT ON TABLE deposits IS '充值记录';
COMMENT ON TABLE withdrawals IS '提现记录';
COMMENT ON TABLE user_strategies IS '用户策略配置';
COMMENT ON TABLE strategy_signals IS '策略信号历史';
COMMENT ON TABLE audit_logs IS '用户活动日志';
COMMENT ON TABLE notifications IS '用户通知表';
COMMENT ON TABLE price_data IS '价格数据 (TimescaleDB)';
COMMENT ON TABLE position_snapshots IS '仓位快照 (TimescaleDB)';
COMMENT ON TABLE strategy_performance IS '策略性能追踪 (TimescaleDB)';

-- 完成
SELECT 'Database initialization completed!' AS status;
