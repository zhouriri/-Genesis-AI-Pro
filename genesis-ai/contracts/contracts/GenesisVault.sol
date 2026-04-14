// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./GenesisSynth.sol";
import "./RiskManager.sol";

/**
 * @title GenesisVault
 * @notice 用户资金库核心合约
 * @dev 管理用户存款、仓位、盈亏计算
 */
contract GenesisVault is AccessControl {
    
    // ============ 常量 ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    uint256 public constant MIN_DEPOSIT = 10 * 1e6;  // 最低存款 $10 USDC (6位精度)
    uint256 public constant WITHDRAWAL_FEE_RATE = 10; // 0.1% 手续费
    
    // ============ 数据结构 ============
    
    /// @notice 用户持仓信息
    struct Position {
        uint256 collateral;           // 抵押品数量 (USDC)
        uint256 syntheticAmount;       // 合成资产数量
        address syntheticAsset;         // 合成资产地址
        uint256 entryPrice;            // 入场价格 (18位精度)
        uint256 leverage;               // 杠杆倍数 (1x, 2x, 3x...)
        uint256 timestamp;             // 开仓时间
        bool isLong;                   // 多头/空头
    }
    
    /// @notice 用户信息
    struct UserInfo {
        uint256 totalDeposited;        // 总存款
        uint256 totalWithdrawn;        // 总取款
        int256 totalPnL;              // 累计盈亏
        uint256 openPositionsCount;     // 活跃仓位数
        mapping(address => Position) positions;  // 用户仓位映射 (合成资产地址 -> 仓位)
    }
    
    // ============ 状态变量 ============
    
    IERC20 public usdc;                       // USDC 代币
    GenesisSynth public synth;                  // 合成资产合约
    RiskManager public riskManager;             // 风险管理合约
    
    mapping(address => UserInfo) public users; // 用户信息映射
    mapping(address => bool) public authorizedAI; // 授权 AI Agent 地址列表
    
    // ============ 事件 ============
    
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount, uint256 fee);
    event PositionOpened(address indexed user, bytes32 positionId, address asset, uint256 amount, uint256 leverage, bool isLong);
    event PositionClosed(address indexed user, bytes32 positionId, int256 pnl);
    event PnLUpdated(address indexed user, int256 pnl);
    event AIAuthorized(address indexed aiAddress);
    event AIRevoked(address indexed aiAddress);
    
    // ============ 构造函数 ============
    
    constructor(
        address _usdc,
        address _synth,
        address _riskManager
    ) {
        usdc = IERC20(_usdc);
        synth = GenesisSynth(_synth);
        riskManager = RiskManager(_riskManager);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    // ============ 核心函数 ============
    
    /**
     * @notice 用户存款
     * @param amount 存款金额 (USDC, 6位精度)
     */
    function deposit(uint256 amount) external {
        require(amount >= MIN_DEPOSIT, "GenesisVault: Deposit too small");
        require(!isRestrictedUser(msg.sender), "GenesisVault: User restricted");
        
        // 转账 USDC 到合约
        require(usdc.transferFrom(msg.sender, address(this), amount), "GenesisVault: Transfer failed");
        
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
        require(getUserAvailableBalance(msg.sender) >= amount, "GenesisVault: Insufficient balance");
        
        // 计算手续费 (0.1%)
        uint256 fee = (amount * WITHDRAWAL_FEE_RATE) / 10000;
        uint256 netAmount = amount - fee;
        
        // 转账给用户
        require(usdc.transfer(msg.sender, netAmount), "GenesisVault: Transfer failed");
        
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
        riskManager.validatePosition(user, syntheticAsset, leverage, collateralAmount);
        
        // 检查用户可用余额是否足够
        require(getUserAvailableBalance(user) >= collateralAmount, "GenesisVault: Insufficient collateral");
        
        // 锁定抵押品
        UserInfo storage userInfo = users[user];
        Position storage pos = userInfo.positions[syntheticAsset];
        
        // 如果已经有同资产仓位，先平仓
        if (pos.syntheticAmount > 0) {
            _closePosition(user, syntheticAsset);
        }
        
        // 开新仓
        pos.collateral = collateralAmount;
        pos.syntheticAmount = syntheticAmount;
        pos.syntheticAsset = syntheticAsset;
        pos.entryPrice = synth.getPrice(syntheticAsset);
        pos.leverage = leverage;
        pos.isLong = isLong;
        pos.timestamp = block.timestamp;
        
        userInfo.openPositionsCount++;
        
        // 铸造合成资产
        synth.mint(user, syntheticAsset, syntheticAmount);
        
        bytes32 positionId = keccak256(abi.encode(user, syntheticAsset, block.timestamp));
        emit PositionOpened(user, positionId, syntheticAsset, syntheticAmount, leverage, isLong);
    }
    
    /**
     * @notice AI Agent 平仓
     */
    function closePosition(address user, address syntheticAsset) external onlyAuthorizedAI {
        _closePosition(user, syntheticAsset);
    }
    
    /**
     * @notice 内部平仓实现
     */
    function _closePosition(address user, address syntheticAsset) internal {
        Position storage pos = users[user].positions[syntheticAsset];
        require(pos.syntheticAmount > 0, "GenesisVault: No open position");
        
        // 计算盈亏
        int256 pnl = calculatePnL(user, syntheticAsset);
        
        // 销毁合成资产
        synth.burn(user, syntheticAsset, pos.syntheticAmount);
        
        // 更新用户状态
        UserInfo storage userInfo = users[user];
        userInfo.openPositionsCount--;
        userInfo.totalPnL += pnl;
        
        // 返还抵押品 + 盈亏
        uint256 returnAmount;
        if (pnl >= 0) {
            returnAmount = pos.collateral + uint256(pnl);
        } else {
            uint256 loss = uint256(-pnl);
            returnAmount = loss > pos.collateral ? 0 : pos.collateral - loss;
        }
        
        if (returnAmount > 0) {
            require(usdc.transfer(user, returnAmount), "GenesisVault: Transfer failed");
        }
        
        // 清空仓位
        delete userInfo.positions[syntheticAsset];
        
        bytes32 positionId = keccak256(abi.encode(user, syntheticAsset, pos.timestamp));
        emit PositionClosed(user, positionId, pnl);
        emit PnLUpdated(user, pnl);
    }
    
    /**
     * @notice 计算仓位盈亏
     */
    function calculatePnL(address user, address syntheticAsset) public view returns (int256) {
        Position storage pos = users[user].positions[syntheticAsset];
        if (pos.syntheticAmount == 0) return 0;
        
        uint256 currentPrice = synth.getPrice(syntheticAsset);
        uint256 entryValue = (pos.syntheticAmount * pos.entryPrice) / 1e18;
        uint256 currentValue = (pos.syntheticAmount * currentPrice) / 1e18;
        
        int256 priceChange = int256(currentValue) - int256(entryValue);
        int256 pnl = priceChange * int256(pos.leverage);
        
        return pos.isLong ? pnl : -pnl;
    }
    
    /**
     * @notice 获取用户可用余额
     */
    function getUserAvailableBalance(address user) public view returns (uint256) {
        UserInfo storage userInfo = users[user];
        uint256 lockedCollateral = 0;
        
        // 计算所有活跃仓位的锁定抵押品
        // 注意：这里简化实现，实际需要遍历所有合成资产
        // 生产环境需要维护用户活跃资产列表
        
        uint256 pnl = userInfo.totalPnL > 0 ? uint256(userInfo.totalPnL) : 0;
        return (userInfo.totalDeposited - userInfo.totalWithdrawn + pnl) - lockedCollateral;
    }
    
    /**
     * @notice 获取用户仓位（供RiskManager调用）
     */
    function getUserPosition(address user, address syntheticAsset) external view returns (Position memory) {
        return users[user].positions[syntheticAsset];
    }
    
    /**
     * @notice 获取用户基本信息（供RiskManager调用）
     */
    function getUserInfo(address user) external view returns (uint256 totalDeposited, uint256 totalWithdrawn, int256 totalPnL, uint256 openPositionsCount) {
        UserInfo storage userInfo = users[user];
        return (userInfo.totalDeposited, userInfo.totalWithdrawn, userInfo.totalPnL, userInfo.openPositionsCount);
    }
    
    // ============ 访问控制 ============
    
    modifier onlyAuthorizedAI() {
        require(authorizedAI[msg.sender], "GenesisVault: Not authorized AI");
        _;
    }
    
    /**
     * @notice 授权 AI Agent
     */
    function authorizeAI(address aiAddress) external onlyRole(ADMIN_ROLE) {
        require(aiAddress != address(0), "GenesisVault: Invalid AI address");
        authorizedAI[aiAddress] = true;
        emit AIAuthorized(aiAddress);
    }
    
    /**
     * @notice 撤销 AI 授权
     */
    function revokeAIAccess(address aiAddress) external onlyRole(ADMIN_ROLE) {
        require(authorizedAI[aiAddress], "GenesisVault: AI not authorized");
        authorizedAI[aiAddress] = false;
        emit AIRevoked(aiAddress);
    }
    
    // ============ 合规相关 ============
    
    function isRestrictedUser(address user) public view returns (bool) {
        // TODO: 集成地理过滤器和 KYC 检查
        return false;
    }
}
