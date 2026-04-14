import { Router } from "express";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const router = Router();

// GET /api/v1/portfolio - 获取投资组合概览
router.get("/", async (req, res) => {
  res.json({
    success: true,
    data: {
      summary: {
        totalValue: "10523.45",
        totalPnL: "523.45",
        totalPnLPercent: "5.23",
        cashBalance: "1000.00",
        activePositions: 3,
        totalDeposited: "10000.00"
      },
      positions: [],
      performance: {
        last24h: "+1.2%",
        last7d: "+4.5%",
        last30d: "+12.3%",
        last90d: "+22.5%"
      },
      lastUpdated: new Date().toISOString()
    }
  });
});

// POST /api/v1/portfolio/deposit - 创建充值订单
router.post("/deposit", async (req, res, next) => {
  try {
    const { amount, chain } = req.body;
    if (!amount || !chain) {
      throw new AppError("缺少必填参数", 400, "MISSING_PARAMS");
    }
    logger.info("充值订单创建", { amount, chain });
    res.json({
      success: true,
      data: { id: "deposit_" + Date.now(), amount, chain, status: "pending", createdAt: new Date().toISOString() }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/portfolio/withdraw - 创建提现订单
router.post("/withdraw", async (req, res, next) => {
  try {
    const { amount, chain, destinationAddress } = req.body;
    if (!amount || !chain || !destinationAddress) {
      throw new AppError("缺少必填参数", 400, "MISSING_PARAMS");
    }
    logger.info("提现订单创建", { amount, chain, destinationAddress });
    const fee = (parseFloat(amount) * 0.001).toFixed(6);
    res.json({
      success: true,
      data: {
        id: "withdrawal_" + Date.now(),
        amount,
        fee,
        netAmount: (parseFloat(amount) * 0.999).toFixed(6),
        chain,
        destinationAddress,
        status: "pending",
        estimatedTime: "5-10 minutes",
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/portfolio/positions/:id - 获取仓位详情
router.get("/positions/:id", async (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    data: {
      id,
      assetSymbol: "sBTC",
      side: "long",
      entryPrice: "43000.00",
      currentPrice: "43500.00",
      size: "0.5",
      collateral: "5000.00",
      leverage: 2,
      unrealizedPnl: "250.00",
      openedAt: new Date().toISOString()
    }
  });
});

// DELETE /api/v1/portfolio/positions/:id - 平仓
router.delete("/positions/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info("仓位平仓", { id });
    res.json({
      success: true,
      data: { positionId: id, status: "closed", realizedPnl: "250.00", closedAt: new Date().toISOString() }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
