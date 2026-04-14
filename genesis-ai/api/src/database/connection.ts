/**
 * 数据库操作层 - 基于 Sequelize ORM
 */
import { sequelize, User, Position, Transaction, Strategy, Signal, PriceHistory, RiskEvent } from "./database";

// 用户相关操作
export const userDb = {
  findByWallet: async (walletAddress: string) => {
    return await User.findOne({ where: { walletAddress } });
  },

  findById: async (id: string) => {
    return await User.findByPk(id);
  },

  create: async (user: { id: string; walletAddress: string; email?: string }) => {
    return await User.create(user);
  },

  update: async (id: string, updates: Record<string, any>) => {
    const record = await User.findByPk(id);
    if (record) {
      await record.update(updates);
    }
    return record;
  },

  updateLastActive: async (id: string) => {
    const record = await User.findByPk(id);
    if (record) {
      await record.update({ updatedAt: new Date() });
    }
  },
};

// 仓位相关操作
export const positionDb = {
  findByUser: async (userId: string, status?: string) => {
    const where: any = { userId };
    if (status) where.status = status;
    return await Position.findAll({ where });
  },

  findById: async (id: string) => {
    return await Position.findByPk(id);
  },

  create: async (position: any) => {
    return await Position.create(position);
  },

  updateStatus: async (id: string, status: string, closedBy?: string, closedReason?: string) => {
    const record = await Position.findByPk(id);
    if (record) {
      await record.update({
        status,
        closePrice: record.getDataValue("currentPrice"),
        closedAt: new Date(),
      });
    }
    return record;
  },

  getUserSummary: async (userId: string) => {
    const positions = await Position.findAll({ where: { userId } });
    const openPositions = positions.filter(p => (p as any).status === "open");
    const totalPnl = openPositions.reduce((sum, p) => sum + (Number((p as any).unrealizedPnl) || 0), 0);
    return {
      total_positions: positions.length,
      open_positions: openPositions.length,
      total_pnl: totalPnl,
    };
  },
};

// 交易历史
export const tradeDb = {
  findByUser: async (userId: string, limit = 50) => {
    return await Transaction.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      limit,
    });
  },

  create: async (trade: any) => {
    return await Transaction.create(trade);
  },
};

// 策略信号
export const signalDb = {
  findLatest: async (userId: string, limit = 20) => {
    return await Signal.findAll({
      order: [["createdAt", "DESC"]],
      limit,
    });
  },

  create: async (signal: any) => {
    return await Signal.create(signal);
  },
};

// 通知
export const notificationDb = {
  findUnread: async (userId: string) => {
    // 占位：实际需要通知表
    return [];
  },

  create: async (notification: any) => {
    // 占位：实际需要通知表
    return notification;
  },

  markAsRead: async (id: string) => {
    // 占位
  },
};

// 初始化数据库连接
export async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log("数据库连接成功");
    await sequelize.sync({ alter: false });
    console.log("数据库表同步完成");
  } catch (error) {
    console.error("数据库初始化失败:", error);
    throw error;
  }
}
