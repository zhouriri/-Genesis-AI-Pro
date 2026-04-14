-- Genesis AI 数据库迁移脚本
-- 版本: 001
-- 说明: 创建所有核心表

-- 启用 UUID 扩展（用于 PostgreSQL）
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 用户表
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  email TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  metadata TEXT
);

-- ========================================
-- 仓位表
-- ========================================
CREATE TABLE IF NOT EXISTS positions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  asset_symbol TEXT NOT NULL,
  asset_address TEXT,
  side TEXT NOT NULL CHECK (side IN ('long', 'short')),
  entry_price TEXT NOT NULL,
  current_price TEXT NOT NULL,
  size TEXT NOT NULL,
  collateral TEXT NOT NULL,
  leverage INTEGER NOT NULL CHECK (leverage > 0),
  unrealized_pnl TEXT DEFAULT '0',
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'liquidated')),
  close_price TEXT,
  realized_pnl TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- 交易记录表
-- ========================================
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdraw', 'open_position', 'close_position', 'liquidation')),
  amount TEXT NOT NULL,
  asset_symbol TEXT,
  asset_address TEXT,
  tx_hash TEXT,
  chain_id INTEGER,
  block_number INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- 策略表
-- ========================================
CREATE TABLE IF NOT EXISTS strategies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  expected_return TEXT,
  max_drawdown TEXT,
  parameters TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 策略激活表
-- ========================================
CREATE TABLE IF NOT EXISTS strategy_activations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  strategy_id TEXT NOT NULL,
  activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deactivated_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE,
  UNIQUE(user_id, strategy_id)
);

-- ========================================
-- AI 信号表
-- ========================================
CREATE TABLE IF NOT EXISTS signals (
  id TEXT PRIMARY KEY,
  strategy_id TEXT,
  asset_symbol TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('buy', 'sell', 'hold')),
  confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  reason TEXT,
  price_at_signal TEXT,
  executed BOOLEAN DEFAULT false,
  executed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
);

-- ========================================
-- 价格历史表
-- ========================================
CREATE TABLE IF NOT EXISTS price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  price TEXT NOT NULL,
  change_24h TEXT,
  change_percent_24h TEXT,
  volume_24h TEXT,
  source TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 风险事件表
-- ========================================
CREATE TABLE IF NOT EXISTS risk_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('stop_loss', 'take_profit', 'liquidation', 'margin_call')),
  position_id TEXT,
  amount TEXT,
  reason TEXT,
  health_factor REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL
);

-- ========================================
-- 索引
-- ========================================
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_asset ON positions(asset_symbol);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_positions_opened_at ON positions(opened_at);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at);
CREATE INDEX IF NOT EXISTS idx_signals_asset ON signals(asset_symbol);
CREATE INDEX IF NOT EXISTS idx_signals_executed ON signals(executed);

CREATE INDEX IF NOT EXISTS idx_price_history_symbol ON price_history(symbol);
CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp);

CREATE INDEX IF NOT EXISTS idx_risk_events_user_id ON risk_events(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_events_type ON risk_events(event_type);
CREATE INDEX IF NOT EXISTS idx_risk_events_created_at ON risk_events(created_at);

-- ========================================
-- 插入默认策略
-- ========================================
INSERT OR IGNORE INTO strategies (id, name, description, risk_level, expected_return, max_drawdown, is_active) VALUES
('conservative', '保守型策略', '低波动，稳定收益，主要投资 BTC/ETH/GOLD', 'low', '3-8%', '5%', true),
('balanced', '平衡型策略', '中等波动，平衡收益与风险，包含加密和传统资产', 'medium', '8-15%', '15%', true),
('aggressive', '激进型策略', '高波动，追求高收益，加密资产占比高', 'high', '15-30%', '30%', true);
