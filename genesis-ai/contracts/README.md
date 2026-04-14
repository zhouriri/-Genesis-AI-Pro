# 智能合约模块

## 📋 说明

Genesis AI 智能合约，管理用户资金、合成资产和风险管理。

## 🚀 快速开始

```bash
npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy-test.ts
```

## 📁 文件说明

- `contracts/` - Solidity 合约源码
  - `GenesisVault.sol` - 资金库合约
  - `GenesisSynth.sol` - 合成资产合约
  - `RiskManager.sol` - 风险管理合约
  - `AIPermission.sol` - AI 授权管理合约
- `test/` - 测试文件
- `scripts/` - 部署脚本
- `deployments/` - 部署信息

## 🔗 已部署合约 (Hardhat 测试网)

```
GenesisVault:   0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
GenesisSynth:   0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
RiskManager:    0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

## 📝 测试

```bash
npm test                    # 运行所有测试
npm run test:coverage       # 测试覆盖率
```

## 🚢 部署

```bash
npx hardhat run scripts/deploy.ts --network hardhat
```

测试网部署需要配置 `.env` 文件。
