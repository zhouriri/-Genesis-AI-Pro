# Genesis AI Pro

> AI 驱动的链上合成资产投资平台 + AI 个人助手开发环境

---

## 📁 项目结构

```
Genesis-AI-Pro/
├── genesis-ai/          # AI 投资平台主项目
│   ├── ai-agent/        # AI Agent 核心
│   ├── api/             # 后端 API
│   ├── contracts/       # Solidity 智能合约
│   ├── web/             # 前端 (Next.js)
│   ├── telegram-bot/    # Telegram 交易机器人
│   └── ...
├── openclaw/            # OpenClaw AI 助手配置
│   ├── .coze/           # Coze 插件配置
│   ├── openclaw.json    # 配置文件
│   └── scripts/         # 启动脚本
├── skills/              # AI 辅助开发 Skills
│   ├── agent-browser/   # 浏览器自动化
│   ├── cs-code-reviewer/# 代码审查
│   ├── frontend-design/ # 前端界面设计
│   └── fullstack-developer/
├── reports/             # 开发报告
├── genesis-ai-dashboard-preview.html  # Dashboard 预览
├── genesis-ai-web-preview.html        # Web 预览
├── AGENTS.md            # AI 助手指南
├── SOUL.md              # AI 灵魂与安全规则
└── USER.md / TOOLS.md   # 个人配置
```

---

## 🚀 快速启动

### AI 投资平台

```bash
cd genesis-ai
./start.sh        # 启动所有服务
./dev.sh          # 开发模式
./stop.sh         # 停止服务
```

### OpenClaw AI 助手

```bash
cd openclaw
./scripts/start.sh
```

---

## 🎯 核心功能

| 模块 | 描述 |
|------|------|
| **Telegram Bot** | 12+ 交易命令，策略管理，信号展示 |
| **AI Agent** | 链上开仓/平仓，Gas 估算 |
| **LayerZero** | 跨链 USDC 转账 |
| **地理阻断** | 黑名单/白名单管理 |
| **跟单功能** | 热门策略复制交易 |

---

## 🔧 技术栈

- **前端**: Next.js 14, React, TypeScript, TailwindCSS
- **后端**: Python (FastAPI), Node.js
- **区块链**: Solidity 0.8.20, Ethers.js, LayerZero
- **AI**: Coze / OpenAI, LangChain
- **基础设施**: Docker, GitHub Actions

---

## 📄 License

MIT
