import { Router } from "express";
import { z, ZodError } from "zod";
import jwt from "jsonwebtoken";
import { verifyMessage } from "ethers";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const router = Router();

// JWT 密钥 - 生产环境应从环境变量读取
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const JWT_EXPIRES_IN = "24h";

const connectWalletSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  signature: z.string().min(1, "Signature is required"),
  message: z.string().min(1, "Message is required"),
  timestamp: z.number(),
});

// 签名过期时间（15分钟）
const SIGNATURE_EXPIRY_MS = 15 * 60 * 1000;

interface JwtPayload {
  userId: string;
  address: string;
  iat?: number;
  exp?: number;
}

// 验证签名是否过期
function isSignatureExpired(timestamp: number): boolean {
  const now = Date.now();
  const age = now - timestamp;
  return age > SIGNATURE_EXPIRY_MS || age < -SIGNATURE_EXPIRY_MS;
}

// POST /api/v1/auth/wallet/connect - 钱包连接
router.post("/wallet/connect", async (req, res, next) => {
  try {
    const body = connectWalletSchema.parse(req.body);
    logger.info("钱包连接请求", { address: body.address });

    // 1. 验证签名过期
    if (isSignatureExpired(body.timestamp)) {
      throw new AppError("签名已过期，请重新签名", 400, "SIGNATURE_EXPIRED");
    }

    // 2. 验证钱包签名
    try {
      const recoveredAddress = verifyMessage(body.message, body.signature);
      
      // 验证签名者与请求地址一致
      if (recoveredAddress.toLowerCase() !== body.address.toLowerCase()) {
        throw new AppError("签名验证失败：地址不匹配", 401, "INVALID_SIGNATURE");
      }
    } catch (verifyError) {
      if (verifyError instanceof AppError) throw verifyError;
      logger.warn("签名验证失败", { address: body.address, error: String(verifyError) });
      throw new AppError("签名验证失败", 401, "INVALID_SIGNATURE");
    }

    // 3. 生成真实 JWT
    const userId = `user_${body.address.toLowerCase()}`;
    const token = jwt.sign(
      { userId, address: body.address },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 4. 返回用户信息（实际项目中应从数据库查询）
    const user = {
      id: userId,
      address: body.address,
      email: null,
      telegramId: null,
      discordId: null,
      riskProfile: "balanced",
      strategyType: "balanced",
      createdAt: new Date().toISOString(),
    };

    logger.info("钱包连接成功", { address: body.address, userId });

    res.json({
      success: true,
      data: { user, token },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      next(new AppError("验证失败", 400, "VALIDATION_ERROR", error.format()));
    } else if (error instanceof AppError) {
      next(error);
    } else {
      logger.error("钱包连接失败", { error: String(error) });
      next(error);
    }
  }
});

// POST /api/v1/auth/wallet/verify - 验证签名
router.post("/wallet/verify", async (req, res, next) => {
  try {
    const body = connectWalletSchema.parse(req.body);
    logger.info("签名验证请求", { address: body.address });

    // 验证签名过期
    if (isSignatureExpired(body.timestamp)) {
      throw new AppError("签名已过期，请重新签名", 400, "SIGNATURE_EXPIRED");
    }

    // 验证签名
    try {
      const recoveredAddress = verifyMessage(body.message, body.signature);
      
      if (recoveredAddress.toLowerCase() !== body.address.toLowerCase()) {
        res.json({
          success: true,
          data: { valid: false, address: body.address, reason: "Address mismatch" }
        });
        return;
      }

      res.json({
        success: true,
        data: { valid: true, address: body.address }
      });
    } catch (verifyError) {
      logger.warn("签名验证失败", { address: body.address, error: String(verifyError) });
      res.json({
        success: true,
        data: { valid: false, address: body.address, reason: "Verification failed" }
      });
    }
  } catch (error) {
    if (error instanceof ZodError) {
      next(new AppError("验证失败", 400, "VALIDATION_ERROR", error.format()));
    } else if (error instanceof AppError) {
      next(error);
    } else {
      next(error);
    }
  }
});

// GET /api/v1/auth/session - 获取当前会话
router.get("/session", async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("无授权头", 401, "UNAUTHORIZED");
    }

    const token = authHeader.slice(7); // 移除 "Bearer " 前缀

    // 验证 JWT
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    res.json({
      success: true,
      data: {
        user: { 
          id: decoded.userId, 
          address: decoded.address, 
          riskProfile: "balanced" 
        },
        expiresAt: new Date(decoded.exp! * 1000).toISOString()
      }
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError("Token 无效", 401, "INVALID_TOKEN"));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError("Token 已过期", 401, "TOKEN_EXPIRED"));
    } else if (error instanceof AppError) {
      next(error);
    } else {
      next(error);
    }
  }
});

// DELETE /api/v1/auth/session - 登出
router.delete("/session", async (req, res, next) => {
  try {
    // 客户端应删除本地存储的 token
    // 服务器端如需黑名单机制，可在此添加 Redis 记录
    res.json({ success: true, data: { message: "登出成功" } });
  } catch (error) {
    next(error);
  }
});

// 中间件：验证 JWT（供其他路由使用）
export function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("需要登录", 401, "UNAUTHORIZED"));
  }

  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError("Token 已过期", 401, "TOKEN_EXPIRED"));
    }
    return next(new AppError("Token 无效", 401, "INVALID_TOKEN"));
  }
}

export default router;
