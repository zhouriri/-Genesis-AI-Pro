# 后端 API 模块

## 📋 说明

Genesis AI 后端 API，提供组合管理、价格查询、策略管理等服务。

## 🚀 快速开始

```bash
npm install
DATABASE_URL=sqlite:./data/genesis.db PORT=4000 PRICE_TEST_MODE=true npm run dev
```

## 📁 文件说明

- `src/` - 源码目录
  - `routes/` - API 路由
  - `services/` - 业务服务（价格、策略等）
  - `middleware/` - 中间件
  - `database/` - 数据库模型
- `data/` - 数据文件

## 🔌 API 接口

- `GET /api/v1/health` - 健康检查
- `GET /api/v1/portfolio` - 组合数据
- `GET /api/v1/prices` - 价格列表
- `GET /api/v1/strategies` - 策略列表
- `GET /api/v1/strategies/signals` - AI 信号

## 🗄️ 数据库

支持 PostgreSQL 和 SQLite：
- **开发环境**: SQLite（默认）
- **生产环境**: PostgreSQL

## 🧪 测试

```bash
npm test
```

## 🚢 部署

```bash
npm run build
NODE_ENV=production DATABASE_URL=postgresql://... npm start
```
