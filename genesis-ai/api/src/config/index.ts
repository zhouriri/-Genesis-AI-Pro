import dotenv from "dotenv";

dotenv.config();

export const config = {
  // 服务器
  port: parseInt(process.env.PORT || "4001"),
  nodeEnv: process.env.NODE_ENV || "development",

  // 数据库
  database: {
    url: process.env.DATABASE_URL || "postgresql://genesis:genesis@localhost:5432/genesis",
    poolMin: 2,
    poolMax: 10,
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
    expiresIn: "24h",
  },

  // 区块链
  blockchain: {
    polygonZkEVM: {
      rpcUrl: process.env.POLYGON_ZKEVM_RPC_URL || "https://rpc.public.zkevm.net",
      chainId: 1101,
    },
    arbitrum: {
      rpcUrl: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
      chainId: 42161,
    },
    base: {
      rpcUrl: process.env.BASE_RPC_URL || "https://mainnet.base.org",
      chainId: 8453,
    },
  },

  // 合约地址
  contracts: {
    usdc: process.env.USDC_ADDRESS || "",
    vault: process.env.VAULT_ADDRESS || "",
    synth: process.env.SYNTH_ADDRESS || "",
    riskManager: process.env.RISK_MANAGER_ADDRESS || "",
    aiPermission: process.env.AI_PERMISSION_ADDRESS || "",
  },

  // AI 服务
  ai: {
    apiUrl: process.env.AI_AGENT_URL || "http://localhost:8000",
  },

  // 第三方服务
  external: {
    pyth: process.env.PYTH_API_URL || "https://api.pyth.network",
    alchemy: process.env.ALCHEMY_API_KEY || "",
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
    sendgridApiKey: process.env.SENDGRID_API_KEY || "",
  },

  // 限流
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 每个IP最多100个请求
  },
};

export default config;
