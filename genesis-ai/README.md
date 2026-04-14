# Genesis AI Pro

AI-driven on-chain synthetic asset investment platform.

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18.x-brightgreen?style=flat-square&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Solidity-0.8.20-blue?style=flat-square&logo=solidity" alt="Solidity">
  <img src="https://img.shields.io/badge/Python-3.10+-yellow?style=flat-square&logo=python" alt="Python">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License">
  <img src="https://img.shields.io/github/v/release/zhouriri/-Genesis-AI-Pro?style=flat-square" alt="GitHub release (latest by date)">
  <img src="https://img.shields.io/github/stars/zhouriri/-Genesis-AI-Pro?style=flat-square" alt="GitHub stars">
  <img src="https://img.shields.io/github/forks/zhouriri/-Genesis-AI-Pro?style=flat-square" alt="GitHub forks">
</p>

<p align="center">
  <a href="https://github.com/zhouriri/-Genesis-AI-Pro/actions/workflows/ci.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/zhouriri/-Genesis-AI-Pro/ci.yml?style=flat-square" alt="CI Status">
  </a>
  <a href="https://github.com/zhouriri/-Genesis-AI-Pro/issues">
    <img src="https://img.shields.io/github/issues/zhouriri/-Genesis-AI-Pro?style=flat-square" alt="Issues">
  </a>
  <a href="https://github.com/zhouriri/-Genesis-AI-Pro/pulls">
    <img src="https://img.shields.io/github/issues-pr/zhouriri/-Genesis-AI-Pro?style=flat-square" alt="PRs">
  </a>
</p>

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.x
- Python >= 3.10
- npm >= 9.x

### Installation

```bash
# Clone the repository
git clone https://github.com/zhouriri/-Genesis-AI-Pro.git
cd -Genesis-AI-Pro

# Install all dependencies
npm run install
```

### Configuration

Create environment files:

```bash
# Backend (api/.env)
DATABASE_URL=sqlite:./data/genesis.db
PORT=4000
PRICE_TEST_MODE=true

# Frontend (web/.env.local)
NEXT_PUBLIC_API_URL=http://localhost:4000

# Contracts (contracts/.env)
PRIVATE_KEY=your_private_key_here
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
```

### Development

```bash
# Start all services
npm run dev

# Or start individually
cd api && npm run dev     # Backend: http://localhost:4000
cd web && npm run dev     # Frontend: http://localhost:3001
```

---

## 📁 Project Structure

```
genesis-ai/
├── contracts/          # Smart contracts (Solidity 0.8.20)
│   ├── contracts/       # Contract source code
│   ├── test/           # Contract tests
│   ├── scripts/         # Deployment scripts
│   └── deployments/     # Deployment artifacts
├── api/                # Backend API
│   ├── src/            # Express + TypeScript
│   └── database/       # Sequelize ORM models
├── web/                # Frontend application
│   ├── app/            # Next.js 16 pages
│   └── components/     # React components
├── ai-agent/           # AI trading agent
│   └── src/            # Python + LangChain
├── docs/               # Technical documentation
└── .github/            # GitHub templates
```

---

## 🎯 Features

- 🤖 **AI-Driven Trading** - Autonomous strategy engine
- ⚡ **USDC Investment** - No KYC required
- ⛓️ **On-Chain Transparency** - All operations verifiable
- 🔄 **Cross-Chain Support** - Polygon zkEVM, Arbitrum, Base
- 📊 **Real-Time Analytics** - Portfolio tracking
- 🔐 **Secure by Design** - Battle-tested contracts

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Smart Contracts | Solidity, Hardhat, OpenZeppelin, Pyth Network |
| Frontend | Next.js 16, React 19, Tailwind CSS, Wagmi, Viem |
| Backend | Express, TypeScript, Sequelize ORM |
| AI Agent | Python, LangChain, Web3.py |
| Database | PostgreSQL, SQLite (dev) |
| Infrastructure | Docker, Railway, Vercel |

---

## 📖 Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Smart Contracts](./docs/CONTRACTS.md)
- [Deployment](./DEPLOYMENT.md)
- [Environment Setup](./ENV.md)

---

## 🧪 Testing

```bash
# Smart contract tests
cd contracts && npm test

# Backend tests
cd api && npm test

# AI Agent tests
cd ai-agent && pytest
```

---

## 🔒 Security

For security concerns, please read our [SECURITY.md](./.github/SECURITY.md).

**Important:** Never commit real private keys or secrets to the repository.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

Contributions are welcome! Please read our [CONTRIBUTING.md](./.github/CONTRIBUTING.md) before submitting PRs.

---

## 📧 Contact

- GitHub Issues: [Issues](https://github.com/zhouriri/-Genesis-AI-Pro/issues)
- Email: support@genesis-ai.example.com

---

<p align="center">
  <strong>Genesis AI Pro</strong> - Build on Web3, Powered by AI 🚀
</p>
