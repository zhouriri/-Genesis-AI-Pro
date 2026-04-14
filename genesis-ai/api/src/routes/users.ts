import { Router } from "express";
import { v4 as uuid } from "uuid";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { userDb, positionDb } from "../database/connection";

const router = Router();

// GET /api/v1/users/me - 获取当前用户信息
router.get("/me", async (req, res, next) => {
  try {
    const walletAddress = req.headers["x-wallet-address"] as string;
    
    if (!walletAddress) {
      throw new AppError("需要钱包地址", 401, "UNAUTHORIZED");
    }

    let user = userDb.findByWallet(walletAddress) as any;
    
    if (!user) {
      const newUser = {
        id: uuid(),
        wallet_address: walletAddress,
        email: undefined,
        telegram_id: undefined,
        discord_id: undefined
      };
      userDb.create(newUser);
      user = userDb.findByWallet(walletAddress) as any;
      logger.info("新用户创建", { walletAddress });
    }

    userDb.updateLastActive(user.id);

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/users/me - 更新用户配置
router.patch("/me", async (req, res, next) => {
  try {
    const walletAddress = req.headers["x-wallet-address"] as string;
    const { riskProfile, strategyType, email, telegramId } = req.body;

    if (!walletAddress) {
      throw new AppError("需要钱包地址", 401, "UNAUTHORIZED");
    }

    const user = userDb.findByWallet(walletAddress) as any;
    if (!user) {
      throw new AppError("用户不存在", 404, "USER_NOT_FOUND");
    }

    const updates: Record<string, any> = {};
    if (riskProfile) updates.risk_profile = riskProfile;
    if (strategyType) updates.strategy_type = strategyType;
    if (email !== undefined) updates.email = email;
    if (telegramId !== undefined) updates.telegram_id = telegramId;

    if (Object.keys(updates).length > 0) {
      userDb.update(user.id, updates);
    }

    logger.info("用户配置更新", { walletAddress, updates });
    res.json({ success: true, data: { message: "配置更新成功" } });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/users/me/portfolio - 获取用户组合
router.get("/me/portfolio", async (req, res, next) => {
  try {
    const walletAddress = req.headers["x-wallet-address"] as string;
    
    if (!walletAddress) {
      throw new AppError("需要钱包地址", 401, "UNAUTHORIZED");
    }

    const user = userDb.findByWallet(walletAddress) as any;
    if (!user) {
      throw new AppError("用户不存在", 404, "USER_NOT_FOUND");
    }

    const summary = positionDb.getUserSummary(user.id) as any;
    const positions = positionDb.findByUser(user.id, "open") as any[];

    res.json({
      success: true,
      data: {
        totalValue: (summary?.total_pnl || 0) + 10000,
        totalPnL: summary?.total_pnl || 0,
        totalPnLPercent: 5.23,
        positions: positions.map(p => ({
          assetSymbol: p.asset_symbol,
          side: p.side,
          entryPrice: p.entry_price,
          currentPrice: p.current_price || p.entry_price,
          size: p.size,
          collateral: p.collateral,
          leverage: p.leverage,
          unrealizedPnl: p.unrealized_pnl
        })),
        cashBalance: 10000,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/users/me/positions - 获取用户仓位
router.get("/me/positions", async (req, res, next) => {
  try {
    const walletAddress = req.headers["x-wallet-address"] as string;
    const { status } = req.query;

    if (!walletAddress) {
      throw new AppError("需要钱包地址", 401, "UNAUTHORIZED");
    }

    const user = userDb.findByWallet(walletAddress) as any;
    if (!user) {
      throw new AppError("用户不存在", 404, "USER_NOT_FOUND");
    }

    const positions = positionDb.findByUser(user.id, status as string) as any[];

    res.json({
      success: true,
      data: { positions, total: positions.length }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/users/me/history - 获取交易历史
router.get("/me/history", async (req, res, next) => {
  try {
    const walletAddress = req.headers["x-wallet-address"] as string;
    const page = parseInt(req.query.page as string || "1");
    const pageSize = parseInt(req.query.pageSize as string || "20");

    if (!walletAddress) {
      throw new AppError("需要钱包地址", 401, "UNAUTHORIZED");
    }

    const user = userDb.findByWallet(walletAddress) as any;
    if (!user) {
      throw new AppError("用户不存在", 404, "USER_NOT_FOUND");
    }

    const trades = positionDb.findByUser(user.id) as any[];

    res.json({
      success: true,
      data: { trades: trades.slice(0, pageSize), total: trades.length, page, pageSize }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
