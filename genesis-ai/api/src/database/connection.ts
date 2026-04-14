import db, { initDatabase } from "./database";

// 初始化数据库
try {
  initDatabase();
} catch (error) {
  console.error("数据库初始化失败:", error);
}

// 用户相关操作
export const userDb = {
  findByWallet: (walletAddress: string) => {
    return db.prepare("SELECT * FROM users WHERE wallet_address = ?").get(walletAddress);
  },

  findById: (id: string) => {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  },

  create: (user: {
    id: string;
    wallet_address: string;
    email?: string;
    telegram_id?: string;
    discord_id?: string;
  }) => {
    const stmt = db.prepare(`
      INSERT INTO users (id, wallet_address, email, telegram_id, discord_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(user.id, user.wallet_address, user.email || null, user.telegram_id || null, user.discord_id || null);
  },

  update: (id: string, updates: Record<string, any>) => {
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(", ");
    const values = Object.values(updates);
    return db.prepare(`UPDATE users SET ${fields}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
  },

  updateLastActive: (id: string) => {
    return db.prepare("UPDATE users SET last_active_at = datetime('now') WHERE id = ?").run(id);
  }
};

// 仓位相关操作
export const positionDb = {
  findByUser: (userId: string, status?: string) => {
    if (status) {
      return db.prepare("SELECT * FROM positions WHERE user_id = ? AND status = ?").all(userId, status);
    }
    return db.prepare("SELECT * FROM positions WHERE user_id = ?").all(userId);
  },

  findById: (id: string) => {
    return db.prepare("SELECT * FROM positions WHERE id = ?").get(id);
  },

  create: (position: Record<string, any>) => {
    const stmt = db.prepare(`
      INSERT INTO positions (id, user_id, position_id, asset_symbol, asset_address, side, 
        entry_price, current_price, size, collateral, leverage, unrealized_pnl, realized_pnl,
        status, opened_at, stop_loss_price, take_profit_price, strategy_type, transaction_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      position.id, position.user_id, position.position_id, position.asset_symbol,
      position.asset_address, position.side, position.entry_price, position.current_price,
      position.size, position.collateral, position.leverage, position.unrealized_pnl,
      position.realized_pnl, position.status, position.opened_at, position.stop_loss_price,
      position.take_profit_price, position.strategy_type, position.transaction_hash
    );
  },

  updateStatus: (id: string, status: string, closedBy?: string, closedReason?: string) => {
    return db.prepare(`
      UPDATE positions 
      SET status = ?, closed_at = datetime('now'), closed_by = ?, closed_reason = ?
      WHERE id = ?
    `).run(status, closedBy || null, closedReason || null, id);
  },

  getUserSummary: (userId: string) => {
    return db.prepare(`
      SELECT 
        COUNT(*) as total_positions,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_positions,
        SUM(CASE WHEN status = 'open' THEN unrealized_pnl ELSE 0 END) as total_pnl
      FROM positions WHERE user_id = ?
    `).get(userId);
  }
};

// 交易历史
export const tradeDb = {
  findByUser: (userId: string, limit = 50) => {
    return db.prepare("SELECT * FROM trades WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?").all(userId, limit);
  },

  create: (trade: Record<string, any>) => {
    const stmt = db.prepare(`
      INSERT INTO trades (id, user_id, position_id, trade_type, asset_symbol, side, 
        price, size, volume, fee, slippage, executed_by, strategy_type, transaction_hash, block_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      trade.id, trade.user_id, trade.position_id, trade.trade_type, trade.asset_symbol,
      trade.side, trade.price, trade.size, trade.volume, trade.fee, trade.slippage,
      trade.executed_by, trade.strategy_type, trade.transaction_hash, trade.block_number
    );
  }
};

// 策略信号
export const signalDb = {
  findLatest: (userId: string, limit = 20) => {
    return db.prepare("SELECT * FROM strategy_signals WHERE user_id = ? ORDER BY created_at DESC LIMIT ?").all(userId, limit);
  },

  create: (signal: Record<string, any>) => {
    const stmt = db.prepare(`
      INSERT INTO strategy_signals (id, user_id, asset_symbol, signal_type, confidence, 
        target_weight, urgency, reason, signal_sources, executed, execution_result)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      signal.id, signal.user_id, signal.asset_symbol, signal.signal_type,
      signal.confidence, signal.target_weight, signal.urgency, signal.reason,
      JSON.stringify(signal.signal_sources), signal.executed ? 1 : 0,
      JSON.stringify(signal.execution_result)
    );
  }
};

// 通知
export const notificationDb = {
  findUnread: (userId: string) => {
    return db.prepare("SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC").all(userId);
  },

  create: (notification: Record<string, any>) => {
    const stmt = db.prepare(`
      INSERT INTO notifications (id, user_id, channel, notification_type, title, message, data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      notification.id, notification.user_id, notification.channel,
      notification.notification_type, notification.title, notification.message,
      JSON.stringify(notification.data)
    );
  },

  markAsRead: (id: string) => {
    return db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(id);
  }
};

export default db;
