import { Sequelize, DataTypes } from "sequelize";
import { config } from "../config";
import { logger } from "../utils/logger";

// 初始化数据库连接
let sequelize: Sequelize;

// SQLite 配置（开发环境）
const isDevelopment = process.env.NODE_ENV === "development" || !process.env.DATABASE_URL.includes("postgresql");

if (isDevelopment) {
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: process.env.DATABASE_URL?.replace("sqlite:", "") || "./data/genesis.db",
    logging: false, // 设置为 true 以查看 SQL 查询
  });
  logger.info("使用 SQLite 数据库（开发模式）");
} else {
  // PostgreSQL 配置（生产环境）
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    pool: {
      min: config.database.poolMin,
      max: config.database.poolMax,
    },
  });
  logger.info("使用 PostgreSQL 数据库（生产模式）");
}

// ========================================
// 定义模型
// ========================================

// 用户模型
export const User = sequelize.define("users", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  walletAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: "wallet_address",
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: "is_active",
  },
  metadata: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: "users",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

// 仓位模型
export const Position = sequelize.define("positions", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "user_id",
    references: {
      model: "users",
      key: "id",
    },
  },
  assetSymbol: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "asset_symbol",
  },
  assetAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    field: "asset_address",
  },
  side: {
    type: DataTypes.ENUM("long", "short"),
    allowNull: false,
  },
  entryPrice: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    field: "entry_price",
  },
  currentPrice: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
    field: "current_price",
  },
  size: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
  },
  collateral: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
  },
  leverage: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  unrealizedPnl: {
    type: DataTypes.DECIMAL(20, 8),
    defaultValue: 0,
    field: "unrealized_pnl",
  },
  status: {
    type: DataTypes.ENUM("open", "closed", "liquidated"),
    defaultValue: "open",
    allowNull: false,
  },
  closePrice: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    field: "close_price",
  },
  realizedPnl: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    field: "realized_pnl",
  },
}, {
  tableName: "positions",
  timestamps: true,
  createdAt: "opened_at",
  updatedAt: false,
});

// 交易记录模型
export const Transaction = sequelize.define("transactions", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "user_id",
    references: {
      model: "users",
      key: "id",
    },
  },
  transactionType: {
    type: DataTypes.ENUM("deposit", "withdraw", "open_position", "close_position", "liquidation"),
    allowNull: false,
    field: "transaction_type",
  },
  amount: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
  },
  assetSymbol: {
    type: DataTypes.STRING,
    allowNull: true,
    field: "asset_symbol",
  },
  assetAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    field: "asset_address",
  },
  txHash: {
    type: DataTypes.STRING,
    allowNull: true,
    field: "tx_hash",
  },
  chainId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: "chain_id",
  },
  blockNumber: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: "block_number",
  },
  metadata: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: "transactions",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
});

// 策略模型
export const Strategy = sequelize.define("strategies", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  riskLevel: {
    type: DataTypes.ENUM("low", "medium", "high"),
    allowNull: false,
    field: "risk_level",
  },
  expectedReturn: {
    type: DataTypes.STRING,
    allowNull: true,
    field: "expected_return",
  },
  maxDrawdown: {
    type: DataTypes.STRING,
    allowNull: true,
    field: "max_drawdown",
  },
  parameters: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: "is_active",
  },
}, {
  tableName: "strategies",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

// AI 信号模型
export const Signal = sequelize.define("signals", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  strategyId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: "strategy_id",
    references: {
      model: "strategies",
      key: "id",
    },
  },
  assetSymbol: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "asset_symbol",
  },
  signalType: {
    type: DataTypes.ENUM("buy", "sell", "hold"),
    allowNull: false,
    field: "signal_type",
  },
  confidence: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0,
      max: 1,
    },
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  priceAtSignal: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    field: "price_at_signal",
  },
  executed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  executedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: "executed_at",
  },
}, {
  tableName: "signals",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
});

// 价格历史模型
export const PriceHistory = sequelize.define("price_history", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  symbol: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false,
  },
  change24h: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    field: "change_24h",
  },
  changePercent24h: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: true,
    field: "change_percent_24h",
  },
  volume24h: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
    field: "volume_24h",
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "price_history",
  timestamps: false,
});

// 风险事件模型
export const RiskEvent = sequelize.define("risk_events", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "user_id",
    references: {
      model: "users",
      key: "id",
    },
  },
  eventType: {
    type: DataTypes.ENUM("stop_loss", "take_profit", "liquidation", "margin_call"),
    allowNull: false,
    field: "event_type",
  },
  positionId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: "position_id",
    references: {
      model: "positions",
      key: "id",
    },
  },
  amount: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  healthFactor: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: "health_factor",
  },
}, {
  tableName: "risk_events",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
});

// ========================================
// 关联关系
// ========================================

// User 和 Position 的关系
User.hasMany(Position, {
  foreignKey: "userId",
  as: "positions",
});

Position.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// User 和 Transaction 的关系
User.hasMany(Transaction, {
  foreignKey: "userId",
  as: "transactions",
});

Transaction.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Strategy 和 Signal 的关系
Strategy.hasMany(Signal, {
  foreignKey: "strategyId",
  as: "signals",
});

Signal.belongsTo(Strategy, {
  foreignKey: "strategyId",
  as: "strategy",
});

// Position 和 RiskEvent 的关系
Position.hasMany(RiskEvent, {
  foreignKey: "positionId",
  as: "riskEvents",
});

RiskEvent.belongsTo(Position, {
  foreignKey: "positionId",
  as: "position",
});

// 导出数据库实例和模型
export { sequelize };

// 数据库连接测试
export async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info("数据库连接成功");
    return true;
  } catch (error) {
    logger.error("数据库连接失败", error);
    return false;
  }
}

// 同步数据库（开发环境用）
export async function syncDatabase(force = false) {
  try {
    await sequelize.sync({ force });
    logger.info("数据库表结构同步完成");
    
    // 插入默认策略
    await insertDefaultStrategies();
    
    return true;
  } catch (error) {
    logger.error("数据库同步失败", error);
    return false;
  }
}

// 插入默认策略
async function insertDefaultStrategies() {
  const defaultStrategies = [
    {
      id: "conservative",
      name: "保守型策略",
      description: "低波动，稳定收益，主要投资 BTC/ETH/GOLD",
      riskLevel: "low",
      expectedReturn: "3-8%",
      maxDrawdown: "5%",
      isActive: true,
    },
    {
      id: "balanced",
      name: "平衡型策略",
      description: "中等波动，平衡收益与风险，包含加密和传统资产",
      riskLevel: "medium",
      expectedReturn: "8-15%",
      maxDrawdown: "15%",
      isActive: true,
    },
    {
      id: "aggressive",
      name: "激进型策略",
      description: "高波动，追求高收益，加密资产占比高",
      riskLevel: "high",
      expectedReturn: "15-30%",
      maxDrawdown: "30%",
      isActive: false,
    },
  ];

  for (const strategy of defaultStrategies) {
    await Strategy.findOrCreate({
      where: { id: strategy.id },
      defaults: strategy,
    });
  }

  logger.info("默认策略已插入");
}
