# Web 前端模块

## 📋 说明

Genesis AI Web 前端，提供用户界面和钱包连接功能。

## 🚀 快速开始

```bash
npm install
npm run dev
```

前端运行在 http://localhost:3001

## 📁 文件说明

- `app/` - Next.js 页面
  - `page.tsx` - 首页
  - `dashboard/` - 用户仪表板
- `lib/` - 工具函数和 API 客户端
- `components/` - React 组件

## 🔌 页面路由

- `/` - 首页（品牌展示、资产展示）
- `/dashboard` - 仪表板（钱包连接、组合概览、AI 信号）

## 👛 钱包连接

支持 MetaMask 等以太坊钱包：
- Polygon zkEVM
- Polygon Amoy Testnet
- Arbitrum
- Base

## 🧪 测试

```bash
npm test
```

## 🚢 部署

```bash
npm run build
npm start
```

生产环境需要配置环境变量：
```bash
NEXT_PUBLIC_API_URL=https://api.genesis-ai.com
```
