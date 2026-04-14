# Genesis AI — 技术架构设计文档

> 文档版本：v1.0
> 创建日期：2026-04-05
> 作者：Genesis AI 一人公司 Agent
> 状态：🔄 设计中

---

## 一、整体技术架构

### 1.1 技术栈总览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Genesis AI 技术栈                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                         用户交互层 (Presentation)                     │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  Web App    │  │ Telegram    │  │  Discord    │  │  Mobile App │  │  │
│  │  │  React      │  │   Bot       │  │    Bot      │  │ React Native│  │  │
│  │  │  TypeScript │  │ Node.js     │  │  Node.js    │  │  TypeScript │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                          API 网关层 (API Gateway)                    │  │
│  │  ┌───────────────────────────────────────────────────────────────┐   │  │
│  │  │  Next.js API Routes / Express.js                            │   │  │
│  │  │  • 认证中间件（Wallet Signature）                              │   │  │
│  │  │  • 速率限制（Rate Limiting）                                  │   │  │
│  │  │  • 请求验证（Zod Schema）                                     │   │  │
│  │  │  • 缓存层（Redis）                                           │   │  │
│  │  └───────────────────────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                          业务服务层 (Business Logic)                 │  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  │
│  │  │  AI Strategy │  │  Portfolio  │  │   User      │  │ Notification│ │  │
│  │  │   Engine    │  │  Manager    │  │  Service    │  │   Service   │ │  │
│  │  │  Python/Fast│  │   Service   │  │             │  │             │ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  │
│  │  │   Order     │  │   Risk      │  │   KYC/AML  │  │   Admin     │ │  │
│  │  │  Executor   │  │  Engine     │  │   Service  │  │  Dashboard  │ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                          数据层 (Data Layer)                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  │
│  │  │ PostgreSQL  │  │   Redis     │  │ TimescaleDB │  │   IPFS      │ │  │
│  │  │ (主数据库)   │  │  (缓存/队列) │  │ (时序数据)   │  │ (文件存储)   │ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        区块链交互层 (Blockchain)                       │  │
│  │                                                                       │  │
│  │  ┌───────────────────────────────────────────────────────────────┐   │  │
│  │  │  Web3.js / Ethers.js                                          │   │  │
│  │  │  • 钱包连接 (WalletConnect, MetaMask)                         │   │  │
│  │  │  • 合约调用 (Read/Write)                                       │   │  │
│  │  │  • 事件监听 (Event Logs)                                       │   │  │
│  │  │  • 交易签名 (EIP-712)                                          │   │  │
│  │  └───────────────────────────────────────────────────────────────┘   │  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  │
│  │  │  Polygon    │  │  Arbitrum   │  │    Base     │  │  Optimism   │ │  │
│  │  │  zkEVM      │  │             │  │             │  │             │ │  │
│  │  │  (主链)     │  │  (Layer2)   │  │  (Layer2)   │  │  (Layer2)   │ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        外部服务层 (External Services)                 │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  │
│  │  │  Pyth       │  │ LayerZero   │  │   Dune      │  │  News API  │ │  │
│  │  │  Network    │  │             │  │  Analytics  │  │            │ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  │
│  │  │ Safe{Wallet}│  │  Alchemy   │  │  CoinGecko  │  │  Telegram   │ │  │
│  │  │  (4337)    │  │  RPC       │  │   Price     │  │    API     │ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 技术选型理由

| 层级 | 技术选型 | 理由 |
|:--|:--|:--|
| **前端框架** | Next.js 14 (App Router) | SSR + SSG，SEO 友好，API Routes 内置 |
| **移动端** | React Native + Expo | 代码复用，Web3 库成熟 |
| **后端语言** | TypeScript (Node.js) + Python | 统一语言栈，Python 用于 AI/ML |
| **API 框架** | Next.js API Routes / FastAPI | 轻量、快速开发 |
| **数据库** | PostgreSQL + Redis + TimescaleDB | 关系型 + 缓存 + 时序分析 |
| **区块链** | ethers.js v6 + wagmi.sh | 主流、类型安全、React 集成 |
| **预言机** | Pyth Network | 毫秒级延迟，支持股票数据 |
| **跨链** | LayerZero | 50+ 链支持，最成熟 |
| **AI/ML** | Python + LangChain + OpenAI | 策略计算、LangChain Agent |
| **基础设施** | Vercel + Railway / Render | 部署简单，扩展性好 |

---

## 二、智能合约架构

### 2.1 合约架构总览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Genesis AI 智能合约架构                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                           权限控制层                                   │    │
│  │  ┌───────────────────────────────────────────────────────────────┐ │    │
│  │  │  AccessManager.sol                                             │ │    │
│  │  │  • 角色管理 (ADMIN, KEEPER, EMERGENCY)                        │ │    │
│  │  │  • 多签验证                                                    │ │    │
│  │  └───────────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                           核心合约层                                   │    │
│  │                                                                       │    │
│  │  ┌───────────────────────────────────────────────────────────────┐ │    │
│  │  │  GenesisVault.sol — 资金库核心                                 │ │    │
│  │  │  • 用户存款/取款 (USDC)                                        │ │    │
│  │  │  • 仓位管理                                                    │ │    │
│  │  │  • 盈亏计算                                                    │ │    │
│  │  │  • 资金隔离                                                    │ │    │
│  │  └───────────────────────────────────────────────────────────────┘ │    │
│  │                                                                       │    │
│  │  ┌───────────────────────────────────────────────────────────────┐ │    │
│  │  │  GenesisSynth.sol — 合成资产核心                               │ │    │
│  │  │  • 合成资产铸造/销毁                                           │ │    │
│  │  │  • 价格追踪                                                    │ │    │
│  │  │  • 零滑点交易                                                  │ │    │
│  │  └───────────────────────────────────────────────────────────────┘ │    │
│  │                                                                       │    │
│  │  ┌───────────────────────────────────────────────────────────────┐ │    │
│  │  │  RiskManager.sol — 风险管理                                   │ │    │
│  │  │  • 杠杆率控制                                                  │ │    │
│  │  │  • 清算机制                                                    │ │    │
│  │  │  • 止损触发                                                    │ │    │
│  │  │  • 最大敞口限制                                                │ │    │
│  │  └───────────────────────────────────────────────────────────────┘ │    │
│  │                                                                       │    │
│  │  ┌───────────────────────────────────────────────────────────────┐ │    │
│  │  │  AIPermission.sol — AI授权管理                                │ │    │
│  │  │  • Session Key 注册                                            │ │    │
│  │  │  • 权限额度                                                    │ │    │
│  │  │  • 授权撤销                                                    │ │    │
│  │  │  • 操作日志                                                    │ │    │
│  │  └───────────────────────────────────────────────────────────────┘ │    │
│  │                                                                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                           周边合约层                                   │    │
│  │                                                                       │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐   │    │
│  │  │  OrderRouter.sol │  │  PriceFeed.sol  │  │  CrossChainBridge  │   │    │
│  │  │  订单路由        │  │  预言机聚合     │  │  跨链桥接           │   │    │
│  │  │  • 聚合流动性   │  │  • Pyth 接入   │  │  • LayerZero 集成   │   │    │
│  │  │  • 最佳价格    │  │  • Chainlink 备 │  │  • 多链 USDC       │   │    │
│  │  │  • 滑点保护    │  │  • 异常检测     │  │  • 跨链取款        │   │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘   │    │
│  │                                                                       │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐   │    │
│  │  │  StrategyRegistry│  │  Treasury.sol   │  │  GeographicFilter  │   │    │
│  │  │  策略注册        │  │  金库管理       │  │  地理过滤器         │   │    │
│  │  │  • 策略激活    │  │  • 手续费收入   │  │  • IP 阻断         │   │    │
│  │  │  • 性能追踪    │  │  • 运营支出     │  │  • 国籍声明验证   │   │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘   │    │
│  │                                                                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                           代币合约层                                   │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐   │    │
│  │  │  USDC.sol        │  │  SyntheticToken │  │  GenesisToken.sol   │   │    │
│  │  │  (封装)          │  │  (ERC20)        │  │  (治理代币,可选)     │   │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘   │    │
│  │                                                                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 核心合约接口设计

#### 2.2.1 GenesisVault.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title GenesisVault
 * @notice 用户资金库核心合约
 * @dev 管理用户存款、仓位、盈亏计算
 */
contract GenesisVault is AccessControl {
    
    // ============ 数据结构 ============
    
    /// @notice 用户持仓信息
    struct Position {
        uint256 collateral;           // 抵押品数量 (USDC)
        uint256 syntheticAmount;       // 合成资产数量
        address syntheticAsset;         // 合成资产地址
        uint256 entryPrice;            // 入场价格
        uint256 leverage;               // 杠杆倍数 (1x, 2x, 3x...)
        uint256 timestamp;             // 开仓时间
        bool isLong;                   // 多头/空头
    }
    
    /// @notice 用户信息
    struct UserInfo {
        uint256 totalDeposited;        // 总存款
        uint256 totalWithdrawn;        // 总取款
        uint256 totalPnL;              // 累计盈亏
        uint256 openPositionsCount;     // 活跃仓位数
        mapping(address => Position) positions;  // 用户仓位映射
    }
    
    // ============ 状态变量 ============
    
    IERC20 public usdc;                       // USDC 代币
    GenesisSynth public synth;                  // 合成资产合约
    RiskManager public riskManager;             // 风险管理合约
    
    mapping(address => UserInfo) public users; // 用户信息映射
    mapping(address => bool) public authorizedAI; // 授权 AI Agent
    
    uint256 public constant MIN_DEPOSIT = 10 * 1e6;  // 最低存款 $10 USDC
    
    // ============ 事件 ============
    
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount, uint256 fee);
    event PositionOpened(address indexed user, bytes32 positionId, address asset, uint256 amount, uint256 leverage);
    event PositionClosed(address indexed user, bytes32 positionId, uint256 pnl);
    event PnLUpdated(address indexed user, int256 pnl);
    
    // ============ 核心函数 ============
    
    /**
     * @notice 用户存款
     * @param amount 存款金额 (USDC, 6位精度)
     */
    function deposit(uint256 amount) external {
        require(amount >= MIN_DEPOSIT, "Deposit too small");
        require(!isRestrictedUser(msg.sender), "User restricted");
        
        // 转账 USDC
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // 更新用户信息
        UserInfo storage user = users[msg.sender];
        user.totalDeposited += amount;
        
        emit Deposited(msg.sender, amount);
    }
    
    /**
     * @notice 用户取款
     * @param amount 取款金额
     */
    function withdraw(uint256 amount) external {
        UserInfo storage user = users[msg.sender];
        require(user.positions[address(0)].collateral >= amount, "Insufficient balance");
        
        // 计算手续费 (0.1%)
        uint256 fee = amount * 10 / 10000;
        uint256 netAmount = amount - fee;
        
        // 转账
        require(usdc.transfer(msg.sender, netAmount), "Transfer failed");
        
        // 更新用户信息
        user.totalWithdrawn += netAmount;
        
        emit Withdrawn(msg.sender, netAmount, fee);
    }
    
    /**
     * @notice AI Agent 开仓
     * @param user 用户地址
     * @param syntheticAsset 合成资产地址
     * @param collateralAmount 抵押品金额
     * @param syntheticAmount 合成资产数量
     * @param leverage 杠杆倍数
     * @param isLong 多头/空头
     */
    function openPosition(
        address user,
        address syntheticAsset,
        uint256 collateralAmount,
        uint256 syntheticAmount,
        uint256 leverage,
        bool isLong
    ) external onlyAuthorizedAI {
        // 风险检查
        riskManager.validatePosition(user, syntheticAsset, leverage);
        
        // 锁定抵押品
        UserInfo storage userInfo = users[user];
        userInfo.positions[syntheticAsset].collateral = collateralAmount;
        userInfo.positions[syntheticAsset].syntheticAmount = syntheticAmount;
        userInfo.positions[syntheticAsset].syntheticAsset = syntheticAsset;
        userInfo.positions[syntheticAsset].entryPrice = synth.getPrice(syntheticAsset);
        userInfo.positions[syntheticAsset].leverage = leverage;
        userInfo.positions[syntheticAsset].isLong = isLong;
        userInfo.positions[syntheticAsset].timestamp = block.timestamp;
        userInfo.openPositionsCount++;
        
        emit PositionOpened(user, keccak256(abi.encode(user, syntheticAsset, block.timestamp)), syntheticAsset, syntheticAmount, leverage);
    }
    
    /**
     * @notice AI Agent 平仓
     */
    function closePosition(address user, address syntheticAsset) external onlyAuthorizedAI {
        // 计算盈亏
        int256 pnl = calculatePnL(user, syntheticAsset);
        
        // 更新状态
        UserInfo storage userInfo = users[user];
        userInfo.positions[syntheticAsset].collateral = 0;
        userInfo.positions[syntheticAsset].syntheticAmount = 0;
        userInfo.openPositionsCount--;
        userInfo.totalPnL += uint256(pnl > 0 ? pnl : -pnl);
        
        // 转账盈亏
        if (pnl != 0) {
            if (pnl > 0) {
                usdc.transfer(user, uint256(pnl));
            }
        }
        
        emit PositionClosed(user, keccak256(abi.encode(user, syntheticAsset)), uint256(pnl));
        emit PnLUpdated(user, pnl);
    }
    
    /**
     * @notice 计算盈亏
     */
    function calculatePnL(address user, address syntheticAsset) public view returns (int256) {
        Position storage pos = users[user].positions[syntheticAsset];
        if (pos.syntheticAmount == 0) return 0;
        
        uint256 currentPrice = synth.getPrice(syntheticAsset);
        uint256 entryValue = pos.syntheticAmount * pos.entryPrice / 1e18;
        uint256 currentValue = pos.syntheticAmount * currentPrice / 1e18;
        
        int256 priceChange = int256(currentValue) - int256(entryValue);
        int256 pnl = priceChange * int256(pos.leverage);
        
        return pos.isLong ? pnl : -pnl;
    }
    
    // ============ 访问控制 ============
    
    modifier onlyAuthorizedAI() {
        require(authorizedAI[msg.sender], "Not authorized AI");
        _;
    }
    
    function authorizeAI(address aiAddress) external onlyRole(ADMIN_ROLE) {
        authorizedAI[aiAddress] = true;
    }
    
    function revokeAIAccess(address aiAddress) external {
        require(msg.sender == aiAddress || hasRole(ADMIN_ROLE, msg.sender), "Not authorized");
        authorizedAI[aiAddress] = false;
    }
    
    // ============ 合规相关 ============
    
    function isRestrictedUser(address user) public view returns (bool) {
        // TODO: 集成地理过滤器
        return false;
    }
}
```

#### 2.2.2 GenesisSynth.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title GenesisSynth
 * @notice 合成资产核心合约
 * @dev 铸造/销毁合成资产，追踪真实资产价格
 */
contract GenesisSynth is AccessControl {
    
    // ============ 数据结构 ============
    
    /// @notice 合成资产信息
    struct SyntheticAsset {
        string name;                   // 名称 (e.g., "Synthetic Tesla")
        string symbol;                 // 符号 (e.g., "sTSLA")
        address priceFeed;             // 价格预言机地址
        uint256 maxSupply;             // 最大供应量
        uint256 totalSupply;           // 当前供应量
        uint8 decimals;                // 精度
    }
    
    // ============ 状态变量 ============
    
    mapping(address => SyntheticAsset) public syntheticAssets;
    address[] public assetList;
    
    IPyth public pyth;                // Pyth 预言机
    address public vault;             // 资金库地址
    
    // ============ 事件 ============
    
    event AssetRegistered(address indexed asset, string name, string symbol);
    event Minted(address indexed user, address indexed asset, uint256 amount);
    event Burned(address indexed user, address indexed asset, uint256 amount);
    
    // ============ 构造函数 ============
    
    constructor(address _pyth) {
        pyth = IPyth(_pyth);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    // ============ 核心函数 ============
    
    /**
     * @notice 注册新的合成资产
     * @param priceFeedId Pyth 价格 ID
     * @param name 名称
     * @param symbol 符号
     * @param maxSupply 最大供应量
     */
    function registerAsset(
        bytes32 priceFeedId,
        string memory name,
        string memory symbol,
        uint256 maxSupply
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address assetAddress = address(uint160(uint256(keccak256(abi.encode(symbol)))));
        
        SyntheticAsset memory asset = SyntheticAsset({
            name: name,
            symbol: symbol,
            priceFeed: address(priceFeedId),
            maxSupply: maxSupply,
            totalSupply: 0,
            decimals: 18
        });
        
        syntheticAssets[assetAddress] = asset;
        assetList.push(assetAddress);
        
        emit AssetRegistered(assetAddress, name, symbol);
    }
    
    /**
     * @notice 铸造合成资产 (由 Vault 调用)
     * @param user 用户地址
     * @param asset 资产地址
     * @param amount 数量
     */
    function mint(address user, address asset, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(msg.sender == vault, "Only vault can mint");
        
        SyntheticAsset storage synth = syntheticAssets[asset];
        require(synth.totalSupply + amount <= synth.maxSupply, "Max supply exceeded");
        
        synth.totalSupply += amount;
        // ERC20 铸造逻辑
        _mint(user, asset, amount);
        
        emit Minted(user, asset, amount);
    }
    
    /**
     * @notice 销毁合成资产
     */
    function burn(address user, address asset, uint256 amount) external onlyRole(BURNER_ROLE) {
        SyntheticAsset storage synth = syntheticAssets[asset];
        synth.totalSupply -= amount;
        _burn(user, asset, amount);
        
        emit Burned(user, asset, amount);
    }
    
    /**
     * @notice 获取资产当前价格
     * @param asset 资产地址
     * @return price 价格 (18位精度)
     */
    function getPrice(address asset) public view returns (uint256) {
        bytes32 priceFeedId = syntheticAssets[asset].priceFeed;
        (int64 price, ) = pyth.getPrice(priceFeedId);
        return uint64(price < 0 ? 0 : price);
    }
    
    /**
     * @notice 批量获取价格
     */
    function getPrices(address[] calldata assets) external view returns (uint256[] memory) {
        uint256[] memory prices = new uint256[](assets.length);
        for (uint256 i = 0; i < assets.length; i++) {
            prices[i] = getPrice(assets[i]);
        }
        return prices;
    }
    
    // ============ 访问控制 ============
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
}
```

#### 2.2.3 AIPermission.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title AIPermission
 * @notice AI 授权管理合约
 * @dev 管理 Session Key、权限额度、操作日志
 */
contract AIPermission is AccessControl {
    
    // ============ 数据结构 ============
    
    /// @notice Session Key 权限
    struct SessionKey {
        address owner;                // 所有者
        address aiAgent;              // AI Agent 地址
        uint256 maxAmount;            // 最大操作金额
        uint256 spentAmount;          // 已使用金额
        uint256 dailyLimit;          // 每日限制
        uint256 spentToday;           // 今日使用
        uint256 validUntil;            // 有效期
        bool isLongTerm;              // 是否长期授权
        bool isRevoked;               // 是否已撤销
        uint256 createdAt;            // 创建时间
    }
    
    /// @notice 授权类型
    enum PermissionType {
        TRADE,                        // 交易
        WITHDRAW,                     // 取款
        DELEGATE                      // 委托
    }
    
    // ============ 状态变量 ============
    
    mapping(bytes32 => SessionKey) public sessionKeys;
    mapping(address => bytes32[]) public userSessions;
    
    uint256 public constant MAX_VALIDITY = 30 days;
    
    // ============ 事件 ============
    
    event SessionKeyCreated(
        bytes32 indexed sessionId,
        address indexed user,
        address indexed aiAgent,
        uint256 maxAmount,
        uint256 validUntil
    );
    
    event SessionKeyUsed(
        bytes32 indexed sessionId,
        address indexed aiAgent,
        uint256 amount,
        PermissionType permission
    );
    
    event SessionKeyRevoked(bytes32 indexed sessionId);
    
    // ============ 核心函数 ============
    
    /**
     * @notice 创建 Session Key
     * @param aiAgent AI Agent 地址
     * @param maxAmount 最大操作金额
     * @param duration 有效期
     * @param isLongTerm 是否长期授权
     */
    function createSessionKey(
        address aiAgent,
        uint256 maxAmount,
        uint256 duration,
        bool isLongTerm
    ) external returns (bytes32 sessionId) {
        require(aiAgent != address(0), "Invalid AI agent");
        require(maxAmount > 0, "Amount must be positive");
        require(duration <= MAX_VALIDITY, "Duration too long");
        
        sessionId = keccak256(abi.encode(
            msg.sender,
            aiAgent,
            block.timestamp,
            maxAmount,
            isLongTerm
        ));
        
        SessionKey storage session = sessionKeys[sessionId];
        session.owner = msg.sender;
        session.aiAgent = aiAgent;
        session.maxAmount = maxAmount;
        session.dailyLimit = maxAmount / 30; // 每日限额 = 总限额的 1/30
        session.validUntil = block.timestamp + duration;
        session.isLongTerm = isLongTerm;
        session.createdAt = block.timestamp;
        
        userSessions[msg.sender].push(sessionId);
        
        emit SessionKeyCreated(sessionId, msg.sender, aiAgent, maxAmount, session.validUntil);
    }
    
    /**
     * @notice AI Agent 执行操作前检查
     */
    function validateAndExecute(
        bytes32 sessionId,
        uint256 amount,
        PermissionType permission
    ) external returns (bool success) {
        SessionKey storage session = sessionKeys[sessionId];
        
        // 基础验证
        require(session.owner != address(0), "Session does not exist");
        require(session.aiAgent == msg.sender, "Not authorized");
        require(!session.isRevoked, "Session revoked");
        require(block.timestamp < session.validUntil, "Session expired");
        
        // 金额验证
        require(session.spentAmount + amount <= session.maxAmount, "Exceeds max amount");
        
        // 每日限额检查
        _resetDailySpent(session);
        require(session.spentToday + amount <= session.dailyLimit, "Exceeds daily limit");
        
        // 更新使用记录
        session.spentAmount += amount;
        session.spentToday += amount;
        
        emit SessionKeyUsed(sessionId, msg.sender, amount, permission);
        
        return true;
    }
    
    /**
     * @notice 撤销 Session Key
     */
    function revokeSession(bytes32 sessionId) external {
        SessionKey storage session = sessionKeys[sessionId];
        require(session.owner == msg.sender, "Not your session");
        
        session.isRevoked = true;
        emit SessionKeyRevoked(sessionId);
    }
    
    /**
     * @notice 获取用户的所有 Session Keys
     */
    function getUserSessions(address user) external view returns (bytes32[] memory) {
        return userSessions[user];
    }
    
    // ============ 内部函数 ============
    
    function _resetDailySpent(SessionKey storage session) internal {
        // 简化版：实际应该用区块时间或外部时间源
        if (session.spentToday > 0) {
            session.spentToday = 0;
        }
    }
}
```

### 2.3 合约部署配置

```javascript
// scripts/deploy.ts

const CONFIG = {
  // Polygon zkEVM Mainnet
  polygonZkEVM: {
    USDC: "0xA8CE8aee21bC2A48a5EF670afCc927bC7bAd2E65",
    Pyth: "0xX4F8260f34453C07B3D0e60709E6E567177B4E09", // 待确认
    LayerZero: "0X60805B4F3C0E1A95D6E7B2E2e8D7A9B3F5f8C3B7",
  },
  
  // Arbitrum
  arbitrum: {
    USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
  
  // Base
  base: {
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  }
};

// 部署顺序
const DEPLOY_ORDER = [
  { name: "GenesisSynth", priority: 1 },
  { name: "GenesisVault", priority: 2, args: [synth.address, usdc.address] },
  { name: "RiskManager", priority: 3, args: [vault.address] },
  { name: "AIPermission", priority: 4 },
  { name: "OrderRouter", priority: 5, args: [synth.address, pyth.address] },
  { name: "CrossChainBridge", priority: 6, args: [layerZero.address] },
];
```

---

## 三、AI Agent 技术架构

### 3.1 AI Agent 系统架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Genesis AI Agent 系统                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         AI Agent Core (Python)                      │    │
│  │                                                                       │    │
│  │  ┌───────────────────────────────────────────────────────────────┐  │    │
│  │  │  LangChain Agent Framework                                     │  │    │
│  │  │  • ReAct 推理引擎                                               │  │    │
│  │  │  • 工具调用管理                                                 │  │    │
│  │  │  • 记忆系统                                                     │  │    │
│  │  └───────────────────────────────────────────────────────────────┘  │    │
│  │                                                                       │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │    │
│  │  │  Strategy Engine │  │  Risk Engine    │  │  Execution Eng. │    │    │
│  │  │                   │  │                 │  │                 │    │    │
│  │  │  • 信号生成       │  │  • 仓位检查     │  │  • 订单执行     │    │    │
│  │  │  • 组合优化       │  │  • 止损检查     │  │  • 滑点控制     │    │    │
│  │  │  • 回测验证       │  │  • 杠杆控制     │  │  • 重试机制     │    │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘    │    │
│  │                                                                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│  ┌─────────────────────────────────┼─────────────────────────────────────┐  │
│  │                                 │                                      │  │
│  ▼                                 ▼                                      ▼  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │  │
│  │  📊 Data Layer  │  │ 🔗 Blockchain   │  │ 💬 Notification │           │  │
│  │                 │  │                 │  │                 │           │  │
│  │  • 价格数据     │  │  • 合约调用     │  │  • Telegram     │           │  │
│  │  • 链上数据     │  │  • 交易签名     │  │  • Discord      │           │  │
│  │  • 新闻情绪     │  │  • 事件监听     │  │  • Email        │           │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘           │  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 AI Agent 数据流

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              数据流向图                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1️⃣ 数据采集                                                                │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────┐  │
│  │ Pyth Network  │  │ Dune Analytics │  │  News API     │  │ Glassnode │  │
│  │ (价格数据)     │  │ (链上数据)     │  │ (情绪数据)    │  │ (持仓数据) │  │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  └─────┬─────┘  │
│          │                   │                   │                 │        │
│          └───────────────────┼───────────────────┴─────────────────┘        │
│                              ▼                                               │
│  2️⃣ 数据处理                                                                │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        Data Processing Pipeline                         │  │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────────────┐     │  │
│  │  │  清洗    │ -> │  聚合    │ -> │  特征    │ -> │  信号生成       │     │  │
│  │  │  Normalize│   │  Combine │   │  Extract │   │  Signal Gen     │     │  │
│  │  └─────────┘    └─────────┘    └─────────┘    └─────────────────┘     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                              │                                               │
│                              ▼                                               │
│  3️⃣ 策略决策                                                                │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         Strategy Decision Engine                        │  │
│  │                                                                       │  │
│  │    ┌────────────────────────────────────────────────────────────┐    │  │
│  │    │                     Portfolio Optimizer                       │    │  │
│  │    │  • Modern Portfolio Theory (MPT)                            │    │  │
│  │    │  • Risk-adjusted returns (Sharpe Ratio)                     │    │  │
│  │    │  • Rebalancing triggers                                     │    │  │
│  │    └────────────────────────────────────────────────────────────┘    │  │
│  │                                                                       │  │
│  │    输入: 用户风险偏好 + 组合当前状态 + 市场信号                        │  │
│  │    输出: 目标仓位 + 调仓指令                                          │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                              │                                               │
│                              ▼                                               │
│  4️⃣ 风险检查                                                                │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                           Risk Check Engine                             │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │  │
│  │  │ 仓位    │  │ 杠杆率   │  │ 止损    │  │ 敞口    │  │ 流动性  │   │  │
│  │  │ 限制    │  │ 检查    │  │ 检查    │  │ 检查    │  │ 检查    │   │  │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘   │  │
│  │       └───────────┴───────────┴───────────┴───────────┴─────────┘     │  │
│  │                              │                                          │  │
│  │                    ┌────────┴────────┐                                  │  │
│  │                    │   Pass / Fail   │                                  │  │
│  │                    └────────┬────────┘                                  │  │
│  └────────────────────────────┼───────────────────────────────────────────┘  │
│                               │                                              │
│              ┌────────────────┴────────────────┐                            │
│              │                                 │                            │
│              ▼                                 ▼                            │
│  ┌───────────────────────┐          ┌───────────────────────┐              │
│  │   ✅ 通过 → 执行        │          │   ❌ 拒绝 → 记录并通知  │              │
│  │                       │          │                       │              │
│  │  生成链上交易          │          │  发送风控通知          │              │
│  │  签名并广播            │          │  给用户和 Admin        │              │
│  │  等待确认              │          │                       │              │
│  └───────────────────────┘          └───────────────────────┘              │
│                              │                                               │
│                              ▼                                               │
│  5️⃣ 执行与监控                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         Execution & Monitoring                          │  │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────────────┐     │  │
│  │  │  交易    │ -> │  状态    │ -> │  更新    │ -> │  通知           │     │  │
│  │  │  广播    │    │  追踪    │    │  仓位   │    │  Telegram/Discord│     │  │
│  │  └─────────┘    └─────────┘    └─────────┘    └─────────────────┘     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 AI Agent 核心代码结构

```
genesis-ai-agent/
├── src/
│   ├── __init__.py
│   │
│   ├── main.py                      # 入口文件
│   │
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py              # 配置管理
│   │   ├── prompts.py               # Prompt 模板
│   │   └── strategies.py            # 策略配置
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── agent.py                 # LangChain Agent
│   │   ├── memory.py                # 记忆系统
│   │   └── tools.py                 # 可用工具
│   │
│   ├── engines/
│   │   ├── __init__.py
│   │   ├── strategy/
│   │   │   ├── __init__.py
│   │   │   ├── signal_generator.py  # 信号生成
│   │   │   ├── portfolio_optimizer.py # 组合优化
│   │   │   └── rebalancer.py        # 调仓引擎
│   │   │
│   │   ├── risk/
│   │   │   ├── __init__.py
│   │   │   ├── risk_engine.py       # 风控引擎
│   │   │   ├── position_manager.py # 仓位管理
│   │   │   └── stop_loss.py         # 止损管理
│   │   │
│   │   └── execution/
│   │       ├── __init__.py
│   │       ├── order_executor.py    # 订单执行
│   │       ├── slippage.py          # 滑点控制
│   │       └── retry.py             # 重试机制
│   │
│   ├── data/
│   │   ├── __init__.py
│   │   ├── market_data.py          # 市场数据
│   │   ├── onchain_data.py         # 链上数据
│   │   ├── sentiment.py             # 情绪数据
│   │   └── cache.py                 # 缓存管理
│   │
│   ├── blockchain/
│   │   ├── __init__.py
│   │   ├── wallet.py                # 钱包管理
│   │   ├── contracts.py             # 合约交互
│   │   └── session_keys.py          # Session Key 管理
│   │
│   ├── notification/
│   │   ├── __init__.py
│   │   ├── telegram.py             # Telegram 通知
│   │   ├── discord.py              # Discord 通知
│   │   └── email.py                # Email 通知
│   │
│   └── utils/
│       ├── __init__.py
│       ├── logger.py               # 日志
│       ├── metrics.py              # 指标收集
│       └── helpers.py              # 辅助函数
│
├── tests/
│   ├── __init__.py
│   ├── test_strategy.py
│   ├── test_risk.py
│   └── test_execution.py
│
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

### 3.4 策略信号模型

```python
# src/engines/strategy/signal_generator.py

from typing import Dict, List
from dataclasses import dataclass
from enum import Enum

class SignalType(Enum):
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"
    REDUCE = "reduce"

@dataclass
class TradingSignal:
    asset: str
    signal_type: SignalType
    confidence: float  # 0-1
    target_weight: float  # 目标仓位权重
    urgency: str  # "high", "medium", "low"
    reason: str
    sources: Dict[str, float]  # 各信号源的置信度

class SignalGenerator:
    """
    多信号融合的策略引擎
    """
    
    def __init__(self):
        # 权重配置
        self.weights = {
            "technical": 0.40,
            "onchain": 0.30,
            "sentiment": 0.20,
            "macro": 0.10
        }
    
    async def generate_signals(
        self,
        assets: List[str],
        user_risk_profile: str  # "conservative", "balanced", "aggressive"
    ) -> Dict[str, TradingSignal]:
        """
        生成所有资产的交易信号
        """
        signals = {}
        
        for asset in assets:
            # 1. 技术信号
            tech_signal = await self._get_technical_signal(asset)
            
            # 2. 链上信号
            onchain_signal = await self._get_onchain_signal(asset)
            
            # 3. 情绪信号
            sentiment_signal = await self._get_sentiment_signal(asset)
            
            # 4. 宏观信号
            macro_signal = await self._get_macro_signal(asset)
            
            # 5. 加权融合
            combined_signal = self._fuse_signals(
                tech_signal,
                onchain_signal,
                sentiment_signal,
                macro_signal,
                user_risk_profile
            )
            
            signals[asset] = combined_signal
        
        return signals
    
    async def _get_technical_signal(self, asset: str) -> Dict:
        """
        技术指标分析
        - RSI 超买超卖
        - MACD 趋势
        - 布林带突破
        - 均线交叉
        """
        # 获取价格数据
        prices = await self.data_source.get_prices(asset, "1h", limit=100)
        
        # 计算指标
        rsi = self._calculate_rsi(prices)
        macd = self._calculate_macd(prices)
        bb_position = self._calculate_bollinger(prices)
        ma_cross = self._calculate_ma_cross(prices)
        
        # 生成信号
        signal_score = 0
        
        if rsi < 30:
            signal_score += 0.3  # 超卖 → 买入倾向
        elif rsi > 70:
            signal_score -= 0.3  # 超买 → 卖出倾向
        
        if macd["trend"] == "bullish":
            signal_score += 0.3
        elif macd["trend"] == "bearish":
            signal_score -= 0.3
        
        # ... 更多指标
        
        return {
            "score": signal_score,  # -1 到 1
            "rsi": rsi,
            "macd": macd,
            "confidence": 0.8
        }
    
    async def _get_onchain_signal(self, asset: str) -> Dict:
        """
        链上数据分析
        - 大户流向
        - 交易所净流入
        - 合约持仓
        """
        # Dune / Glassnode API
        whale_flow = await self.onchain.get_whale_flow(asset)
        exchange_flow = await self.onchain.get_exchange_flow(asset)
        funding_rate = await self.onchain.get_funding_rate(asset)
        
        signal_score = 0
        
        if whale_flow["direction"] == "inflow":
            signal_score += 0.2
        else:
            signal_score -= 0.2
        
        if exchange_flow["netflow"] < 0:
            signal_score += 0.2  # 净流出 → 看涨
        
        return {
            "score": signal_score,
            "whale_flow": whale_flow,
            "confidence": 0.7
        }
    
    async def _get_sentiment_signal(self, asset: str) -> Dict:
        """
        情绪分析
        - Twitter/Facebook 情绪
        - 新闻情感
        - Google Trends
        """
        # 调用 News API + LLM 分析
        sentiment = await self.sentiment.analyze(asset)
        
        return {
            "score": sentiment["score"],  # -1 到 1
            "confidence": sentiment["confidence"]
        }
    
    def _fuse_signals(
        self,
        tech: Dict,
        onchain: Dict,
        sentiment: Dict,
        macro: Dict,
        risk_profile: str
    ) -> TradingSignal:
        """
        多信号加权融合
        """
        # 加权平均
        combined_score = (
            tech["score"] * self.weights["technical"] +
            onchain["score"] * self.weights["onchain"] +
            sentiment["score"] * self.weights["sentiment"] +
            macro["score"] * self.weights["macro"]
        )
        
        # 风险调整
        if risk_profile == "conservative":
            threshold = 0.3  # 更严格的信号阈值
        elif risk_profile == "aggressive":
            threshold = 0.1
        else:
            threshold = 0.2
        
        # 信号类型判断
        if combined_score > threshold:
            signal_type = SignalType.BUY
        elif combined_score < -threshold:
            signal_type = SignalType.SELL
        else:
            signal_type = SignalType.HOLD
        
        # 置信度
        confidence = (
            tech["confidence"] * self.weights["technical"] +
            onchain["confidence"] * self.weights["onchain"] +
            sentiment["confidence"] * self.weights["sentiment"] +
            macro["confidence"] * self.weights["macro"]
        )
        
        return TradingSignal(
            asset=asset,
            signal_type=signal_type,
            confidence=confidence,
            target_weight=abs(combined_score),
            urgency="medium",
            reason=self._generate_reason(tech, onchain, sentiment, macro),
            sources={
                "technical": tech["confidence"],
                "onchain": onchain["confidence"],
                "sentiment": sentiment["confidence"],
                "macro": macro["confidence"]
            }
        )
```

---

## 四、数据库设计

### 4.1 数据库架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            数据库架构                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────┐                                       │
│  │         PostgreSQL              │  主数据库                              │
│  │  (用户、配置、策略、订单)        │                                       │
│  └───────────────┬─────────────────┘                                       │
│                  │                                                          │
│          ┌───────┴───────┐                                                 │
│          │               │                                                 │
│          ▼               ▼                                                 │
│  ┌───────────────┐  ┌───────────────┐                                      │
│  │   TimescaleDB │  │     Redis     │                                      │
│  │  (时序数据)    │  │  (缓存/会话)   │                                      │
│  │  价格、仓位    │  │  热点数据      │                                      │
│  └───────────────┘  └───────────────┘                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 PostgreSQL 表结构

```sql
-- ============================================
-- 用户相关表
-- ============================================

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    email VARCHAR(255),
    telegram_id VARCHAR(50),
    discord_id VARCHAR(50),
    risk_profile VARCHAR(20) DEFAULT 'balanced', -- conservative, balanced, aggressive
    strategy_type VARCHAR(20) DEFAULT 'balanced', -- conservative, balanced, aggressive, custom
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    country_code VARCHAR(3), -- 用于合规检查
    nationality_declared VARCHAR(3), -- 用户声明的国籍
    is_blocked BOOLEAN DEFAULT false,
    block_reason TEXT
);

CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_telegram ON users(telegram_id);
CREATE INDEX idx_users_country ON users(country_code);

-- 用户 Session Keys 表
CREATE TABLE user_session_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(66) UNIQUE NOT NULL, -- 链上 Session ID
    ai_agent_address VARCHAR(42) NOT NULL,
    max_amount DECIMAL(36, 6) NOT NULL, -- 最大授权金额 (USDC)
    daily_limit DECIMAL(36, 6) NOT NULL,
    spent_amount DECIMAL(36, 6) DEFAULT 0,
    spent_today DECIMAL(36, 6) DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    is_long_term BOOLEAN DEFAULT false,
    is_revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_session_user ON user_session_keys(user_id);
CREATE INDEX idx_session_validity ON user_session_keys(valid_until) WHERE NOT is_revoked;

-- ============================================
-- 交易与仓位表
-- ============================================

-- 仓位表
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    position_id VARCHAR(66) UNIQUE NOT NULL, -- 链上 Position ID
    asset_symbol VARCHAR(20) NOT NULL, -- sBTC, sTSLA 等
    asset_address VARCHAR(42) NOT NULL,
    side VARCHAR(5) NOT NULL, -- 'long' 或 'short'
    entry_price DECIMAL(36, 18) NOT NULL,
    current_price DECIMAL(36, 18),
    size DECIMAL(36, 18) NOT NULL, -- 数量
    collateral DECIMAL(36, 6) NOT NULL, -- 抵押品 (USDC)
    leverage DECIMAL(5, 2) NOT NULL,
    unrealized_pnl DECIMAL(36, 6) DEFAULT 0,
    realized_pnl DECIMAL(36, 6) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'open', -- open, closed, liquidated
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by VARCHAR(20), -- 'user', 'ai', 'liquidation', 'stop_loss'
    closed_reason TEXT,
    stop_loss_price DECIMAL(36, 18),
    take_profit_price DECIMAL(36, 18),
    strategy_type VARCHAR(20), -- 触发本次交易的策略
    transaction_hash VARCHAR(66),
    
    CONSTRAINT positive_leverage CHECK (leverage > 0)
);

CREATE INDEX idx_positions_user ON positions(user_id);
CREATE INDEX idx_positions_asset ON positions(asset_symbol);
CREATE INDEX idx_positions_status ON positions(status);
CREATE INDEX idx_positions_opened ON positions(opened_at DESC);

-- 交易历史表
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    position_id UUID REFERENCES positions(id),
    trade_type VARCHAR(10) NOT NULL, -- 'open', 'close', 'add', 'reduce'
    asset_symbol VARCHAR(20) NOT NULL,
    side VARCHAR(5) NOT NULL,
    price DECIMAL(36, 18) NOT NULL,
    size DECIMAL(36, 18) NOT NULL,
    volume DECIMAL(36, 6) NOT NULL, -- 成交金额
    fee DECIMAL(36, 6) NOT NULL,
    slippage DECIMAL(5, 4) DEFAULT 0,
    executed_by VARCHAR(20) NOT NULL, -- 'user', 'ai'
    strategy_type VARCHAR(20),
    transaction_hash VARCHAR(66),
    block_number BIGINT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trades_user ON trades(user_id);
CREATE INDEX idx_trades_position ON trades(position_id);
CREATE INDEX idx_trades_timestamp ON trades(timestamp DESC);

-- 充值/提现记录
CREATE TABLE deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(36, 6) NOT NULL,
    amount_usd DECIMAL(36, 6) NOT NULL,
    chain VARCHAR(20) NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed', -- pending, confirmed, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(36, 6) NOT NULL,
    amount_usd DECIMAL(36, 6) NOT NULL,
    fee DECIMAL(36, 6) NOT NULL,
    chain VARCHAR(20) NOT NULL,
    destination_address VARCHAR(42) NOT NULL,
    transaction_hash VARCHAR(66),
    status VARCHAR(20) DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AI 策略相关表
-- ============================================

-- 用户策略配置
CREATE TABLE user_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    strategy_type VARCHAR(20) NOT NULL, -- conservative, balanced, aggressive, custom
    is_active BOOLEAN DEFAULT true,
    custom_params JSONB, -- 自定义参数
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 策略信号历史
CREATE TABLE strategy_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    asset_symbol VARCHAR(20) NOT NULL,
    signal_type VARCHAR(10) NOT NULL, -- buy, sell, hold, reduce
    confidence DECIMAL(5, 4) NOT NULL,
    target_weight DECIMAL(5, 4),
    urgency VARCHAR(10),
    reason TEXT,
    signal_sources JSONB, -- 各信号源详情
    executed BOOLEAN DEFAULT false,
    execution_result JSONB, -- 执行结果
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_signals_user ON strategy_signals(user_id);
CREATE INDEX idx_signals_asset ON strategy_signals(asset_symbol);
CREATE INDEX idx_signals_created ON strategy_signals(created_at DESC);

-- ============================================
-- 合规与审计表
-- ============================================

-- 用户活动日志
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    action_details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_type ON audit_logs(action_type);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================
-- 通知表
-- ============================================

-- 用户通知
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL, -- telegram, discord, email, in_app
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- 附加数据
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE NOT is_read;
```

### 4.3 TimescaleDB 时序表

```sql
-- 价格数据 (高频)
CREATE TABLE price_data (
    time TIMESTAMPTZ NOT NULL,
    asset_symbol VARCHAR(20) NOT NULL,
    source VARCHAR(20) NOT NULL, -- pyth, coinbase, binance
    price DECIMAL(36, 18) NOT NULL,
    PRIMARY KEY (time, asset_symbol, source)
);

SELECT create_hypertable('price_data', 'time');
CREATE INDEX idx_price_symbol ON price_data(asset_symbol, time DESC);

-- 仓位快照 (每小时)
CREATE TABLE position_snapshots (
    time TIMESTAMPTZ NOT NULL,
    user_id UUID NOT NULL,
    position_id VARCHAR(66) NOT NULL,
    asset_symbol VARCHAR(20) NOT NULL,
    pnl DECIMAL(36, 6) NOT NULL,
    price DECIMAL(36, 18) NOT NULL,
    size DECIMAL(36, 18) NOT NULL,
    collateral DECIMAL(36, 6) NOT NULL,
    unrealized_pnl_pct DECIMAL(10, 4)
);

SELECT create_hypertable('position_snapshots', 'time');
CREATE INDEX idx_snapshot_position ON position_snapshots(position_id, time DESC);

-- 策略性能追踪
CREATE TABLE strategy_performance (
    time TIMESTAMPTZ NOT NULL,
    user_id UUID NOT NULL,
    strategy_type VARCHAR(20) NOT NULL,
    total_pnl DECIMAL(36, 6) NOT NULL,
    total_return_pct DECIMAL(10, 4) NOT NULL,
    Sharpe_ratio DECIMAL(10, 4),
    max_drawdown_pct DECIMAL(10, 4),
    win_rate DECIMAL(5, 4),
    trade_count INTEGER
);

SELECT create_hypertable('strategy_performance', 'time');
```

---

## 五、API 架构

### 5.1 API 端点设计

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API 端点总览                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Base URL: https://api.genesis-ai.finance/v1                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                          认证与用户                                    │  │
│  │                                                                       │  │
│  │  POST   /auth/wallet/connect       钱包连接签名                      │  │
│  │  POST   /auth/wallet/verify        验证签名                          │  │
│  │  GET    /auth/session              获取当前会话                      │  │
│  │  DELETE /auth/session              登出                               │  │
│  │                                                                       │  │
│  │  GET    /users/me                  获取当前用户信息                   │  │
│  │  PATCH  /users/me                  更新用户配置                       │  │
│  │  GET    /users/me/portfolio        获取用户组合                       │  │
│  │  GET    /users/me/positions        获取用户仓位                       │  │
│  │  GET    /users/me/history          获取交易历史                       │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                          存款与取款                                  │  │
│  │                                                                       │  │
│  │  POST   /deposits                    创建充值订单                    │  │
│  │  GET    /deposits                    获取充值记录                    │  │
│  │  GET    /deposits/:id               获取充值详情                    │  │
│  │                                                                       │  │
│  │  POST   /withdrawals                 创建提现订单                    │  │
│  │  GET    /withdrawals                 获取提现记录                    │  │
│  │  GET    /withdrawals/:id            获取提现详情                    │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                          AI 策略管理                                 │  │
│  │                                                                       │  │
│  │  GET    /strategies                    获取可用策略                   │  │
│  │  GET    /strategies/:type              获取策略详情                   │  │
│  │  POST   /strategies/activate           激活策略                      │  │
│  │  POST   /strategies/deactivate          停用策略                      │  │
│  │  GET    /strategies/signals            获取当前信号                  │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        Session Key 管理                               │  │
│  │                                                                       │  │
│  │  POST   /session-keys                     创建 Session Key           │  │
│  │  GET    /session-keys                    获取用户的 Session Keys    │  │
│  │  DELETE /session-keys/:id               撤销 Session Key            │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                          资产与市场                                  │  │
│  │                                                                       │  │
│  │  GET    /assets                           获取支持的资产列表          │  │
│  │  GET    /assets/:symbol                  获取资产详情                │  │
│  │  GET    /assets/:symbol/price            获取实时价格                │  │
│  │  GET    /market/summary                  市场概览                    │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                          通知管理                                    │  │
│  │                                                                       │  │
│  │  GET    /notifications                    获取通知列表               │  │
│  │  PATCH  /notifications/:id/read          标记已读                   │  │
│  │  POST   /notifications/preferences        更新通知偏好               │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 API 响应格式

```typescript
// 成功响应
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

// 错误响应
interface ErrorResponse {
  success: false;
  error: {
    code: string;        // "INVALID_SIGNATURE", "INSUFFICIENT_BALANCE", etc.
    message: string;
    details?: any;
  };
}

// 示例响应

// GET /users/me/portfolio
{
  "success": true,
  "data": {
    "totalValue": "10523.45",
    "totalPnL": "523.45",
    "totalPnLPercent": "5.23",
    "positions": [
      {
        "assetSymbol": "sBTC",
        "balance": "0.5",
        "value": "21500.00",
        "pnl": "250.00",
        "pnlPercent": "1.18"
      },
      {
        "assetSymbol": "sETH",
        "balance": "2.0",
        "value": "4200.00",
        "pnl": "123.45",
        "pnlPercent": "3.03"
      }
    ],
    "cashBalance": "1000.00",
    "lastUpdated": "2026-04-05T12:30:00Z"
  }
}

// GET /strategies
{
  "success": true,
  "data": {
    "strategies": [
      {
        "type": "conservative",
        "name": "保守型",
        "description": "低波动，稳定收益，适合风险厌恶者",
        "expectedReturn": "3-8%",
        "maxDrawdown": "5%",
        "riskLevel": 1,
        "assets": ["sBTC", "sETH", "sXAU"],
        "performance": {
          "last30d": "+4.5%",
          "last90d": "+12.3%",
          "sharpeRatio": "1.8"
        },
        "isActive": false
      },
      {
        "type": "balanced",
        "name": "平衡型",
        "description": "中等波动，平衡收益与风险",
        "expectedReturn": "8-15%",
        "maxDrawdown": "15%",
        "riskLevel": 2,
        "assets": ["sBTC", "sETH", "sAAPL", "sTSLA", "sXAU"],
        "performance": {
          "last30d": "+8.2%",
          "last90d": "+22.5%",
          "sharpeRatio": "1.5"
        },
        "isActive": true
      },
      {
        "type": "aggressive",
        "name": "激进型",
        "description": "高波动，追求高收益",
        "expectedReturn": "15-30%",
        "maxDrawdown": "30%",
        "riskLevel": 3,
        "assets": ["sBTC", "sETH", "sSOL", "sAAPL", "sTSLA", "sNVDA", "sXAU", "sXAG"],
        "performance": {
          "last30d": "+18.5%",
          "last90d": "+45.2%",
          "sharpeRatio": "1.2"
        },
        "isActive": false
      }
    ]
  }
}
```

---

## 六、安全架构

### 6.1 安全层级

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              安全架构                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Layer 1: 网络安全                                                    │  │
│  │  • Cloudflare DDoS 防护                                               │  │
│  │  • WAF 防火墙                                                         │  │
│  │  • Rate Limiting                                                     │  │
│  │  • IP 黑名单                                                          │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Layer 2: 身份认证                                                    │  │
│  │  • 钱包签名验证 (EIP-712)                                             │  │
│  │  • Session Token (JWT)                                               │  │
│  │  • 2FA (Telegram/Email)                                              │  │
│  │  • Device Fingerprinting                                              │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Layer 3: 业务风控                                                    │  │
│  │  • 地理阻断 (美/英/中)                                                │  │
│  │  • 交易限额                                                           │  │
│  │  • 提现延时 (大额)                                                   │  │
│  │  • 异常行为检测                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Layer 4: 智能合约安全                                               │  │
│  │  • 形式化验证                                                         │  │
│  │  • 代码审计 (2次)                                                     │  │
│  │  • 暂停机制                                                           │  │
│  │  • 紧急提取                                                           │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 私钥管理

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            私钥安全管理                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      运营私钥 (Admin Keys)                           │  │
│  │                                                                       │  │
│  │  • 使用 AWS KMS / HashiCorp Vault                                   │  │
│  │  • 多签 (3/5) 管理                                                   │  │
│  │  • 地理分布的密钥分片                                                │  │
│  │  • 24/7 监控 + 告警                                                  │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      AI Agent 私钥 (执行)                            │  │
│  │                                                                       │  │
│  │  • 专用执行钱包 (权限受限)                                           │  │
│  │  • Session Key 限额控制                                              │  │
│  │  • 热钱包 + 冷钱包分层                                               │  │
│  │  • 每日自动归集                                                      │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      用户资产 (非托管)                                │  │
│  │                                                                       │  │
│  │  • 用户私钥永不触碰服务器                                            │  │
│  │  • Safe{Wallet} 智能合约钱包                                        │  │
│  │  • 7/24 链上可验证                                                   │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 七、部署架构

### 7.1 基础设施架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            部署架构 (AWS)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                           CDN / Edge                                 │  │
│  │  CloudFront + Cloudflare                                            │  │
│  │  • 静态资源加速                                                      │  │
│  │  • DDoS 防护                                                        │  │
│  │  • 地理路由                                                          │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        应用层 (Containers)                           │  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │ Web App     │  │ API Server  │  │ AI Agent    │  │ Worker      │  │  │
│  │  │ (Next.js)   │  │ (Express)   │  │ (Python)    │  │ (Background)│  │  │
│  │  │ ECS Fargate │  │ ECS Fargate │  │ ECS Fargate │  │ ECS Fargate │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  │                                                                       │  │
│  │  Auto Scaling: 2-20 instances                                        │  │
│  │  Health Check: /health                                               │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                          ┌──────────┴──────────┐                           │
│                          ▼                     ▼                           │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐          │
│  │        数据库层               │  │         缓存层              │          │
│  │                               │  │                             │          │
│  │  ┌─────────────────────────┐ │  │  ┌───────────────────────┐ │          │
│  │  │  RDS PostgreSQL         │ │  │  │  ElastiCache Redis    │ │          │
│  │  │  (Multi-AZ, Read Replica)│ │  │  │  (Cluster Mode)        │ │          │
│  │  │  • 主库 (us-east-1a)     │ │  │  │  • 缓存               │ │          │
│  │  │  • 从库 (us-east-1b)     │ │  │  │  • Session Store      │ │          │
│  │  │  • 只读副本 (报告)       │ │  │  │  • Rate Limiting      │ │          │
│  │  └─────────────────────────┘ │  │  └───────────────────────┘ │          │
│  │                               │  │                             │          │
│  │  ┌─────────────────────────┐ │  │  ┌───────────────────────┐ │          │
│  │  │  TimescaleDB             │ │  │  │  SQS Queue             │ │          │
│  │  │  (时序数据)              │ │  │  │  • 异步任务            │ │          │
│  │  └─────────────────────────┘ │  │  │  • 事件驱动            │ │          │
│  │                               │  │  └───────────────────────┘ │          │
│  └───────────────────────────────┘  └─────────────────────────────┘          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                           区块链节点                                   │  │
│  │  Alchemy / Infura (RPC Provider)                                     │  │
│  │  • Polygon zkEVM Full Node                                          │  │
│  │  • Arbitrum Archive Node                                            │  │
│  │  • Base Archive Node                                                │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                           监控与日志                                  │  │
│  │  CloudWatch + Datadog + Sentry                                       │  │
│  │  • 性能监控                                                          │  │
│  │  • 错误追踪                                                          │  │
│  │  • 日志分析                                                          │  │
│  │  • 告警 (PagerDuty)                                                  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 环境配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Web App
  web:
    build:
      context: ./web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.genesis-ai.finance
      - NEXT_PUBLIC_CHAIN_ID=1101  # Polygon zkEVM
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # API Server
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/genesis
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G

  # AI Agent
  ai-agent:
    build:
      context: ./ai-agent
      dockerfile: Dockerfile
    environment:
      - PYTHON_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/genesis
      - REDIS_URL=redis://redis:6379
      - ETH_RPC_URL=${POLYGON_RPC}
      - PYTH_API_URL=https://api.pyth.network
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./ai-agent/models:/app/models
    deploy:
      replicas: 2

  # Worker (Background Jobs)
  worker:
    build:
      context: ./api
      dockerfile: Dockerfile
    command: node dist/worker.js
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/genesis
      - REDIS_URL=redis://redis:6379
    deploy:
      replicas: 4

  # Database
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=genesis
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          memory: 4G

  # Redis
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    deploy:
      resources:
        limits:
          memory: 2G

volumes:
  postgres_data:
  redis_data:
```

---

## 八、第三方服务集成

### 8.1 服务依赖清单

| 服务类别 | 服务名称 | 用途 | 成本估算 |
|:--|:--|:--|:--|
| **区块链 RPC** | Alchemy | Polygon/Arbitrum 节点 | ~$50/月 |
| **预言机** | Pyth Network | 价格数据 | 免费 (Gas费) |
| **钱包** | WalletConnect | 钱包连接 | 免费 |
| **智能合约钱包** | Safe{Wallet} | 账户抽象 | 免费 |
| **跨链** | LayerZero | 跨链消息 | ~$100/月 |
| **AI** | OpenAI | 策略分析 | ~$200/月 |
| **数据** | Dune Analytics | 链上数据 | 免费 (API) |
| **通知** | Telegram Bot | 消息推送 | 免费 |
| **邮件** | SendGrid | 邮件通知 | ~$20/月 |
| **监控** | Datadog | APM | ~$50/月 |
| **CDN** | Cloudflare | CDN + 安全 | 免费-Enterprise |

### 8.2 API 密钥管理

```typescript
// src/config/secrets.ts

interface SecretConfig {
  // 区块链
  alchemyApiKey: string;
  polygonRpcUrl: string;
  
  // AI
  openaiApiKey: string;
  
  // 第三方服务
  pythApiKey: string;
  layerZeroEndpoint: string;
  walletConnectProjectId: string;
  
  // 数据库
  databaseUrl: string;
  redisUrl: string;
  
  // JWT
  jwtSecret: string;
  
  // 通知
  telegramBotToken: string;
  sendgridApiKey: string;
}

// 从环境变量或密钥管理服务加载
function loadSecrets(): SecretConfig {
  return {
    alchemyApiKey: process.env.ALCHEMY_API_KEY!,
    polygonRpcUrl: process.env.POLYGON_RPC_URL!,
    openaiApiKey: process.env.OPENAI_API_KEY!,
    // ... 其他密钥
  };
}
```

---

*文档状态：🔄 设计中，待最终确认*
