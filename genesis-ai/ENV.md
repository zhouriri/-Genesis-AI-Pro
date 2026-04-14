# 环境变量配置说明

## 合约配置 (.env)

```bash
# Polygon Amoy 测试网
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology

# 部署私钥（测试网）
PRIVATE_KEY=your_private_key_here

# 浏览器 API Key（用于合约验证）
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# 第三方合约地址
USDC_ADDRESS=0x41E94Eb3c5302F8F03d3D2FcE41C1eA3EEFd8Ae8
PYTH_ADDRESS=0x4305FB66699C3B2702D4d05CF36551390A4c6936
```

## API 配置 (api/.env)

```bash
# 数据库
DATABASE_URL=sqlite:./data/genesis.db

# 服务器
PORT=4000
NODE_ENV=development

# 价格服务
PRICE_TEST_MODE=true
```

## 前端配置 (web/.env.local)

```bash
# API 地址
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 生产环境

生产环境需要修改：
- DATABASE_URL 改为 PostgreSQL 连接字符串
- NEXT_PUBLIC_API_URL 改为生产 API 地址
- 添加其他安全配置
