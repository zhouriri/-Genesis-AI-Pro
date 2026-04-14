import { Router } from "express";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const router = Router();

// 模拟的跟单数据（实际应存到数据库）
const copyTrades = [];

// 模拟的热门策略
const topStrategies = [
  {
    id: "user_1",
    name: "Alpha Master",
    wallet: "0x1234...5678",
    total_pnl: 28450.32,
    win_rate: 0.68,
    trade_count: 156,
    followers: 234,
    risk_level: "high",
    performance: { last7d: "+8.5%", last30d: "+22.3%", last90d: "+45.8%" }
  },
  {
    id: "user_2",
    name: "Steady Growth",
    wallet: "0xabcd...ef01",
    total_pnl: 18500.00,
    win_rate: 0.72,
    trade_count: 89,
    followers: 178,
    risk_level: "medium",
    performance: { last7d: "+4.2%", last30d: "+12.6%", last90d: "+28.4%" }
  },
  {
    id: "user_3",
    name: "Trend Hunter",
    wallet: "0xfedc...ba98",
    total_pnl: 12800.50,
    win_rate: 0.65,
    trade_count: 67,
    followers: 145,
    risk_level: "medium",
    performance: { last7d: "+3.8%", last30d: "+11.2%", last90d:"+24.5%" }
  },
  {
    id: "user_4",
    name: "Safe Harbor",
    wallet: "0x3456...789a",
    total_pnl: 8500.75,
    win_rate: 0.75,
    trade_count: 45,
    followers: 92,
    risk_level: "low",
    performance: { last7d: "+2.1%", last30d: "+6.8%", last90d: "+15.2%" }
  },
  {
    id: "user_5",
    name: "Momentum King",
    wallet: "0x6789...0123",
    total_pnl: 24500.00,
    win_rate: 0.63,
    trade_count: 134,
    followers: 256,
    risk_level: "high",
    performance: { last7d: "+5.6%", last30d: "+18.4%", last90d:"+38.7%" }
  },
];

/**
 * 获取热门策略列表
 */
router.get("/top-strategies", async (req, res, next) => {
  try {
    const sortBy = (req.query.sortBy as string) || "pnl";  // pnl, win_rate, followers
    const riskLevel = (req.query.riskLevel as string) || "";
    
    let strategies = [...topStrategies];
    
    // 按风险等级过滤
    if (riskLevel && riskLevel !== "all") {
      strategies = strategies.filter(s => s.risk_level === riskLevel);
    }
    
    // 排序
    if (sortBy === "pnl") {
      strategies.sort((a, b) => b.total_pnl - a.total_pnl);
    } else if (sortBy === "win_rate") {
      strategies.sort((a, b) => b.win_rate - a.win_rate);
    } else if (sortBy === "followers") {
      strategies.sort((a, b) => b.followers - a.followers);
    }
    
    res.json({ success: true, data: strategies });
  } catch (error) {
    logger.error("获取热门策略失败", error);
    res.status(500).json({ success: false, error: { code: "GET_TOP_STRATEGIES_ERROR", message: "获取热门策略失败" } });
  }
});

/**
 * 获取策略详情
 */
router.get("/strategy/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const strategy = topStrategies.find(s => s.id === userId);
    if (!strategy) {
      throw new AppError("策略不存在", 404, "STRATEGY_NOT_FOUND");
    }
    
    res.json({ success: true, data: strategy });
  } catch (error) {
    logger.error("获取策略详情失败", error);
    res.status(500).json({ success: false, error: { code: "GET_STRATEGY_ERROR", message: "获取策略详情失败" } });
  }
});

/**
 * 创建跟单（复制策略）
 */
router.post("/copy", async (req, res, next) => {
  try {
    const { wallet_address, target_user_id, allocation_percentage, risk_multiplier } = req.body;
    
    if (!wallet_address || !target_user_id) {
      throw new AppError("缺少必要参数", 400, "MISSING_PARAMS");
    }
    
    // 验证目标策略是否存在
    const targetStrategy = topStrategies.find(s => s.id === target_user_id);
    if (!targetStrategy) {
      throw new AppError("目标策略不存在", 404, "STRATEGY_NOT_FOUND");
    }
    
    // 验证分配比例
    const allocation = allocation_percentage || 100;
    if (allocation <= 0 || allocation > 100) {
      throw new AppError("分配比例必须在 0-100 之间", 400, "INVALID_ALLOCATION");
    }
    
    // 验证风险倍数
    const multiplier = risk_multiplier || 1;
    if (multiplier < 0.1 || multiplier > 10) {
      throw new AppError("风险倍数必须在 0.1-10 之间", 400, "INVALID_MULTIPLIER");
    }
    
    // 创建跟单记录
    const copyTrade = {
      id: `copy_${Date.now()}_${wallet_address.slice(-6)}`,
      wallet_address,
      target_user_id,
      allocation_percentage: allocation,
      risk_multiplier: multiplier,
      target_strategy: targetStrategy,
      status: "active",
      created_at: new Date().toISOString(),
      followers_count: targetStrategy.followers + 1,
      last_sync: new Date().toISOString(),
      sync_count: 0,
    };
    
    copyTrades.push(copyTrade);
    
    logger.info("创建跟单", { copyTrade });
    
    res.json({
      success: true,
      data: {
        id: copyTrade.id,
        status: "active",
        target_user_id,
        target_strategy: targetStrategy.name,
        allocation_percentage: allocation,
        risk_multiplier: multiplier,
        followers_count: copyTrade.followers_count,
        created_at: copyTrade.created_at,
      }
    });
  } catch (error) {
    logger.error("创建跟单失败", error);
    res.status(500).json({ success: false, error: { code: "COPY_STRATEGY_ERROR", message: "创建跟单失败" } });
  }
});

/**
 * 获取我的跟单列表
 */
router.get("/my-copies", async (req, res, next) => {
  try {
    const { wallet_address } = req.query;
    
    if (!wallet_address) {
      throw new AppError("缺少钱包地址", 400, "MISSING_WALLET");
    }
    
    const myCopies = copyTrades.filter(c => c.wallet_address === wallet_address);
    
    // 获取每个跟单的当前状态
    const copiesWithStatus = myCopies.map(copy => {
      const targetStrategy = topStrategies.find(s => s.id === copy.target_user_id);
      return {
        ...copy,
        current_pnl: targetStrategy.total_pnl * (copy.allocation_percentage / 100),
        status: copy.status === "active" ? "active" : "paused",
      };
    });
    
    res.json({ success: true, data: copiesWithStatus });
  } catch (error) {
    logger.error("获取跟单列表失败", error);
    res.status(500).json({ success: false, error: { code: "GET_MY_COPIES_ERROR", message: "获取跟单列表失败" } });
  }
});

/**
 * 停止跟单
 */
router.post("/pause", async (req, res, next) => {
  try {
    const { copy_id } = req.body;
    
    if (!copy_id) {
      throw new AppError("缺少跟单 ID", 400, "MISSING_COPY_ID");
    }
    
    const copyTrade = copyTrades.find(c => c.id === copy_id);
    if (!copyTrade) {
      throw new AppError("跟单不存在", 404, "COPY_NOT_FOUND");
    }
    
    copyTrade.status = "paused";
    copyTrade.paused_at = new Date().toISOString();
    
    logger.info("停止跟单", { copy_id, wallet_address: copyTrade.wallet_address });
    
    res.json({
      success: true,
      data: {
        id: copy_id,
        status: "paused",
        paused_at: copyTrade.paused_at,
      }
    });
  } catch (error) {
    logger.error("停止跟单失败", error);
    res.status(500).json({ success: false, error: { code: "PAUSE_COPY_ERROR", message: "停止跟单失败" } });
  }
});

/**
 * 恢复跟单
 */
router.post("/resume", async (req, res, next) => {
  try {
    const { copy_id } = req.body;
    
    if (!copy_id) {
      throw new AppError("缺少跟单 ID", 400, "MISSING_COPY_ID");
    }
    
    const copyTrade = copyTrades.find(c => c.id === copy_id);
    if (!copyTrade) {
      throw new AppError("跟单不存在", 404, "COPY_NOT_FOUND");
    }
    
    copyTrade.status = "active";
    copyTrade.resumed_at = new Date().toISOString();
    
    logger.info("恢复跟单", { copy_id, wallet_address: copyTrade.wallet_address });
    
    res.json({
      success: true,
      data: {
        id: copy_id,
        status: "active",
        resumed_at: copyTrade.resumed_at,
      }
    });
  } catch (error) {
    logger.error("恢复跟单失败", error);
    res.status(500).json({ success: false, error: { code: "RESUME_COPY_ERROR", message: "恢复跟单失败" } });
  }
});

/**
 * 取消跟单
 */
router.post("/cancel", async (req, res, next) => {
  try {
    const { copy_id } = req.body;
    
    if (!copy_id) {
      throw new AppError("缺少跟单 ID", 400, "MISSING_COPY_ID");
    }
    
    const index = copyTrades.findIndex(c => c.id === copy_id);
    if (index === -1) {
      throw new AppError("跟单不存在", 404, "COPY_NOT_FOUND");
    }
    
    const removed = copyTrades.splice(index, 1)[0];
    removed.status = "cancelled";
    removed.cancelled_at = new Date().toISOString();
    
    logger.info("取消跟单", { copy_id, wallet_address: removed.wallet_address });
    
    res.json({
      success: true,
      data: {
        id: copy_id,
        status: "cancelled",
        cancelled_at: removed.cancelled_at,
        final_pnl: removed.current_pnl || 0,
      }
    });
  } catch (error) {
    logger.error("取消跟单失败", error);
    res.status(500).json({ success: false, error: { code: "CANCEL_COPY_ERROR", message: "取消跟单失败" } });
  }
});

export default router;
