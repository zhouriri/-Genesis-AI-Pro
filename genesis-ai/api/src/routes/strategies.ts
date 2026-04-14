import { Router } from "express";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const router = Router();

const strategies = [
  {
    type: "conservative",
    name: "保守型",
    description: "低波动，稳定收益",
    expectedReturn: "3-8%",
    maxDrawdown: "5%",
    riskLevel: 1,
    assets: ["sBTC", "sETH", "sXAU"],
    performance: { last30d: "+4.5%", last90d: "+12.3%", sharpeRatio: "1.8" },
    isActive: false
  },
  {
    type: "balanced",
    name: "平衡型",
    description: "中等波动，平衡收益与风险",
    expectedReturn: "8-15%",
    maxDrawdown: "15%",
    riskLevel: 2,
    assets: ["sBTC", "sETH", "sAAPL", "sTSLA", "sXAU"],
    performance: { last30d: "+8.2%", last90d: "+22.5%", sharpeRatio: "1.5" },
    isActive: true
  },
  {
    type: "aggressive",
    name: "激进型",
    description: "高波动，追求高收益",
    expectedReturn: "15-30%",
    maxDrawdown: "30%",
    riskLevel: 3,
    assets: ["sBTC", "sETH", "sSOL", "sAAPL", "sTSLA", "sNVDA", "sXAU", "sXAG"],
    performance: { last30d: "+18.5%", last90d: "+45.2%", sharpeRatio: "1.2" },
    isActive: false
  }
];

// GET /api/v1/strategies/signals - 获取当前信号 (必须放在动态路由之前)
router.get("/signals", async (req, res) => {
  try {
    // 模拟 AI Agent 生成的信号
    const signals = [
      { id: "1", asset: "sBTC", action: "hold", confidence: 0.72, reason: "BTC 在 67000 附近震荡，等待突破", timestamp: new Date().toISOString() },
      { id: "2", asset: "sETH", action: "buy", confidence: 0.65, reason: "ETH 突破 3400 阻力位，看涨", timestamp: new Date().toISOString() },
      { id: "3", asset: "sTSLA", action: "hold", confidence: 0.58, reason: "TSLA 技术形态整理中", timestamp: new Date().toISOString() },
    ];
    
    res.json({ success: true, data: signals });
  } catch (error) {
    logger.error("获取信号失败", error);
    res.status(500).json({ success: false, error: { code: "FETCH_ERROR", message: "获取信号失败" } });
  }
});

// GET /api/v1/strategies - 获取可用策略列表
router.get("/", async (req, res) => {
  res.json({ success: true, data: { strategies } });
});

// GET /api/v1/strategies/:type - 获取策略详情
router.get("/:type", async (req, res, next) => {
  try {
    const { type } = req.params;
    const strategy = strategies.find(s => s.type === type);
    
    if (!strategy) {
      throw new AppError("策略不存在", 404, "STRATEGY_NOT_FOUND");
    }

    res.json({ success: true, data: strategy });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/strategies/activate - 激活策略
router.post("/activate", async (req, res, next) => {
  try {
    const { strategyType } = req.body;
    if (!["conservative", "balanced", "aggressive"].includes(strategyType)) {
      throw new AppError("无效的策略类型", 400, "INVALID_STRATEGY");
    }
    logger.info("策略激活", { strategyType });
    res.json({ success: true, data: { message: "策略激活成功", strategyType, activatedAt: new Date().toISOString() } });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/strategies/deactivate - 停用策略
router.post("/deactivate", async (req, res, next) => {
  try {
    const { strategyType } = req.body;
    logger.info("策略停用", { strategyType });
    res.json({ success: true, data: { message: "策略停用成功", strategyType } });
  } catch (error) {
    next(error);
  }
});

export default router;
