import { Router } from "express";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

// 模拟的地理检查结果
const GEO_BLOCKED_COUNTRIES = ["US", "GB", "CN", "KP", "IR", "SY"];
const GEO_WHITELIST = [];

const router = Router();

/**
 * 检查用户或国家是否被允许访问
 */
router.post("/check", async (req, res, next) => {
  try {
    const { wallet_address, country_code } = req.body;
    
    // 检查必要参数
    if (!wallet_address) {
      throw new AppError("缺少钱包地址", 400, "MISSING_WALLET");
    }
    
    // 检查黑名单
    const blacklist = ["0x0000000000000000000000000000000000000000000"]; // 示例黑名单
    const isBlacklisted = blacklist.includes(wallet_address.toLowerCase());
    
    // 检查地理阻断
    let isBlocked = false;
    let reason = "";
    
    if (country_code) {
      // 检查白名单
      const isWhitelisted = GEO_WHITELIST.includes(country_code.toUpperCase());
      
      if (!isWhitelisted) {
        // 检查黑名单
        isBlocked = GEO_BLOCKED_COUNTRIES.includes(country_code.toUpperCase());
        if (isBlocked) {
          reason = "受监管限制，该地区暂不支持服务";
        }
      }
    }
    
    // 最终判断
    const allowed = !isBlacklisted && !isBlocked;
    
    res.json({ 
      success: true, 
      data: {
        allowed,
        country_code: country_code || "unknown",
        is_blacklisted: isBlacklisted,
        is_geo_blocked: isBlocked,
        reason: allowed ? "允许访问" : reason
      }
    });
  } catch (error) {
    logger.error("地理检查失败", error);
    res.status(500).json({ success: false, error: { code: "GEO_CHECK_ERROR", message: "地理检查失败" } });
  }
});

/**
 * 获取被阻断的国家列表
 */
router.get("/blocked-countries", async (req, res, next) => {
  res.json({ success: true, data: GEO_BLOCKED_COUNTRIES });
});

/**
 * 获取白名单国家列表
 */
router.get("/whitelisted-countries", async (req, res, next) => {
  res.json({ success: true, data: GEO_WHITELIST });
});

/**
 * 添加到黑名单（仅管理员）
 */
router.post("/blacklist/add", async (req, res, next) => {
  try {
    const { country_code, reason } = req.body;
    
    if (!country_code || country_code.length !== 2) {
      throw new AppError("无效的国家代码", 400, "INVALID_COUNTRY_CODE");
    }
    
    if (!GEO_BLOCKED_COUNTRIES.includes(country_code.toUpperCase())) {
      GEO_BLOCKED_COUNTRIES.push(country_code.toUpperCase());
    }
    
    logger.info("添加黑名单国家", { country_code, reason });
    
    res.json({ 
      success: true, 
      data: {
        country_code: country_code.toUpperCase(),
        reason: reason || "Regulatory restrictions"
      } 
    });
  } catch (error) {
    logger.error("添加黑名单失败", error);
    res.status(500).json({ success: false, error: { code: "ADD_BLACKLIST_ERROR", message: "添加黑名单失败" } });
  }
});

/**
 * 从黑名单移除国家（仅管理员）
 */
router.post("/blacklist/remove", async (req, res, next) => {
  try {
    const { country_code } = req.body;
    
    if (!country_code || country_code.length !== 2) {
      throw new AppError("无效的国家代码", 400, "INVALID_COUNTRY_CODE");
    }
    
    const index = GEO_BLOCKED_COUNTRIES.findIndex(c => c === country_code.toUpperCase());
    if (index !== -1) {
      GEO_BLOCKED_COUNTRIES.splice(index, 1);
    }
    
    logger.info("移除黑名单国家", { country_code });
    
    res.json({ 
      success: true, 
      data: {
        country_code: country_code.toUpperCase(),
        removed: index !== -1
      } 
    });
  } catch (error) {
    logger.error("移除黑名单失败", error);
    res.status(500).json({ success: false, error: { code: "REMOVE_BLACKLIST_ERROR", message: "移除黑名单失败" } });
  }
});

/**
 * 添加到白名单（仅管理员）
 */
router.post("/whitelist/add", async (req, res, next) => {
  try {
    const { country_code, reason } = req.body;
    
    if (!country_code || country_code.length !== 2) {
      throw new AppError("无效的国家代码", 400, "INVALID_COUNTRY_CODE");
    }
    
    if (!GEO_WHITELIST.includes(country_code.toUpperCase())) {
      GEO_WHITELIST.push(country_code.toUpperCase());
    }
    
    logger.info("添加白名单国家", { country_code, reason });
    
    res.json({ 
      success: true, 
      data: {
        country_code: country_code.toUpperCase(),
        reason: reason || "Exception granted"
      } 
    });
  } catch (error) {
    logger.error("添加白名单失败", error);
    res.status(500).json({ success: false, error: { code: "ADD_WHITELIST_ERROR", message: "添加白名单失败" } });
  }
});

export default router;
