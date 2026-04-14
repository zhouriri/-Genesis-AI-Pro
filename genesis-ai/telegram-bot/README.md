# Genesis AI Telegram Bot
# Phase 1 基础交互功能

## 📋 功能列表

### 基础命令
- `/start` - 开始使用
- `/help` - 显示帮助文档
- `/status` - 系统状态

### 账户命令
- `/portfolio` - 查看投资组合
- `/balance` - 查看余额

### 策略命令
- `/strategies` - 查看可用策略
- `/activate <策略类型>` - 激活策略
  - `conservative` - 保守型
  - `balanced` - 平衡型
  - `aggressive` - 激进型
- `/deactivate <策略类型>` - 停用策略
- `/signals` - 查看 AI 交易信号

### 市场命令
- `/prices` - 查看所有资产价格
- `/market` - 市场概览

### 资金命令
- `/withdraw <金额>` - 提现 USDC
- `/history` - 交易历史

## 🚀 快速开始

1. 安装依赖
```bash
cd telegram-bot
pip install -r requirements.txt
```

2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，填入你的 Bot Token
```

3. 启动 Bot
```bash
python bot.py
```

## 📝 技术架构

- **Telegram Bot API** - 通过 python-telegram-bot 库
- **API 交互** - aiohttp 异步 HTTP 请求
- **区块链集成** - web3.py 链上交互（未来扩展）

## ⚠️ 注意事项

1. Bot Token 必须配置，否则无法启动
2. API 服务必须运行在 http://localhost:4000
3. 所有交易通过 Web 界面完成，Bot 仅用于查询
4. AI Agent 运行由独立进程管理

## 🔮 安全

- Bot 仅处理查询请求
- 不处理敏感数据
- 无私钥操作权限

## 📈 后续规划

- Phase 2: 支持更多命令和交互
- 集成真实链上数据查询
- 添加订阅和通知功能
