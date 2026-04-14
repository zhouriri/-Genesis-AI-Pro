import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { config } from "./config";
import authRouter from "./routes/auth";
import userRouter from "./routes/users";
import strategyRouter from "./routes/strategies";
import portfolioRouter from "./routes/portfolio";
import pricesRouter from "./routes/prices";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import "./database/database"; // 初始化数据库

const app = express();

// 中间件
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 请求日志
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// 健康检查
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  });
});

// API 路由
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/strategies", strategyRouter);
app.use("/api/v1/portfolio", portfolioRouter);
app.use("/api/v1/prices", pricesRouter);
app.use("/api/v1/geo-blocking", require("./routes/geo-blocking"));
app.use("/api/v1/copy-trading", require("./routes/copy-trading"));

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Endpoint not found"
    }
  });
});

// 错误处理
app.use(errorHandler);

// 启动
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`🚀 Genesis AI API Server 启动`, { port: PORT, env: config.nodeEnv });
});

export default app;
