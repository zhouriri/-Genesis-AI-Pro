import { Router } from "express";
import { v4 as uuid } from "uuid";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { userDb, positionDb } from "../database/connection";

const router = Router();

// GET /api/v1/users/me
router.get("/me", async (req, res, next) => {
  try {
    const walletAddress = req.headers["x-wallet-address"] as string;
    if (!walletAddress) throw new AppError("需要钱包地址", 401, "UNAUTHORIZED");

    let user: any = await userDb.findByWallet(walletAddress);
    if (!user) {
      await userDb.create({ id: uuid(), walletAddress });
      user = await userDb.findByWallet(walletAddress);
      logger.info("新用户创建", { walletAddress });
    }
    await userDb.updateLastActive(user.id);
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
});

// PATCH /api/v1/users/me
router.patch("/me", async (req, res, next) => {
  try {
    const walletAddress = req.headers["x-wallet-address"] as string;
    if (!walletAddress) throw new AppError("需要钱包地址", 401, "UNAUTHORIZED");
    const user: any = await userDb.findByWallet(walletAddress);
    if (!user) throw new AppError("用户不存在", 404, "USER_NOT_FOUND");
    const updates: any = {};
    if (req.body.riskProfile) updates.riskProfile = req.body.riskProfile;
    if (req.body.strategyType) updates.strategyType = req.body.strategyType;
    if (req.body.email !== undefined) updates.email = req.body.email;
    if (req.body.telegramId !== undefined) updates.telegramId = req.body.telegramId;
    if (Object.keys(updates).length > 0) await userDb.update(user.id, updates);
    logger.info("用户配置更新", { walletAddress, updates });
    res.json({ success: true, data: { message: "配置更新成功" } });
  } catch (error) { next(error); }
});

// GET /api/v1/users/me/portfolio
router.get("/me/portfolio", async (req, res, next) => {
  try {
    const walletAddress = req.headers["x-wallet-address"] as string;
    if (!walletAddress) throw new AppError("需要钱包地址", 401, "UNAUTHORIZED");
    const user: any = await userDb.findByWallet(walletAddress);
    if (!user) throw new AppError("用户不存在", 404, "USER_NOT_FOUND");
    const summary: any = await positionDb.getUserSummary(user.id);
    const positions: any[] = await positionDb.findByUser(user.id, "open");
    res.json({
      success: true,
      data: {
        totalValue: (Number(summary?.total_pnl) || 0) + 10000,
        totalPnL: Number(summary?.total_pnl) || 0,
        totalPnLPercent: 5.23,
        positions: positions.map(p => ({
          assetSymbol: p.assetSymbol, side: p.side, entryPrice: p.entryPrice,
          currentPrice: p.currentPrice || p.entryPrice, size: p.size,
          collateral: p.collateral, leverage: p.leverage, unrealizedPnl: p.unrealizedPnl,
        })),
        cashBalance: 10000, lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) { next(error); }
});

// GET /api/v1/users/me/positions
router.get("/me/positions", async (req, res, next) => {
  try {
    const walletAddress = req.headers["x-wallet-address"] as string;
    if (!walletAddress) throw new AppError("需要钱包地址", 401, "UNAUTHORIZED");
    const user: any = await userDb.findByWallet(walletAddress);
    if (!user) throw new AppError("用户不存在", 404, "USER_NOT_FOUND");
    const positions = await positionDb.findByUser(user.id, req.query.status as string);
    res.json({ success: true, data: { positions, total: positions.length } });
  } catch (error) { next(error); }
});

// GET /api/v1/users/me/history
router.get("/me/history", async (req, res, next) => {
  try {
    const walletAddress = req.headers["x-wallet-address"] as string;
    if (!walletAddress) throw new AppError("需要钱包地址", 401, "UNAUTHORIZED");
    const user: any = await userDb.findByWallet(walletAddress);
    if (!user) throw new AppError("用户不存在", 404, "USER_NOT_FOUND");
    const page = parseInt(req.query.page as string || "1");
    const pageSize = parseInt(req.query.pageSize as string || "20");
    const trades: any[] = await positionDb.findByUser(user.id);
    res.json({ success: true, data: { trades: trades.slice(0, pageSize), total: trades.length, page, pageSize } });
  } catch (error) { next(error); }
});

export default router;
