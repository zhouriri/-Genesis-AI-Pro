// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./GenesisVault.sol";
import "./GenesisSynth.sol";

/**
 * @title RiskManager
 * @notice 风险管理合约
 * @dev 控制杠杆率、最大敞口、清算机制、止损触发
 */
contract RiskManager is AccessControl {
    
    // ============ 常量 ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    
    uint256 public constant MAX_LEVERAGE = 10e18; // 最大 10 倍杠杆
    uint256 public constant MIN_LEVERAGE = 1e18; // 最小 1 倍杠杆
    uint256 public constant LIQUIDATION_THRESHOLD = 80e16; // 80% 保证金率触发清算
    uint256 public constant LIQUIDATION_FEE = 5e16; // 5% 清算手续费
    
    // ============ 状态变量 ============
    
    GenesisVault public vault;
    GenesisSynth public synth;
    
    mapping(address => uint256) public assetMaxExposure; // 每个资产的最大总敞口 (USDC)
    mapping(address => uint256) public userMaxLeverage; // 每个用户的最大杠杆 (默认 5x)
    mapping(address => uint256) public userMaxExposure; // 每个用户的最大总敞口 (USDC)
    
    bool public liquidationsEnabled = true; // 是否开启清算
    
    // ============ 事件 ============
    
    event LiquidationTriggered(address indexed user, address indexed asset, uint256 collateral, uint256 fee);
    event StopLossTriggered(address indexed user, address indexed asset, uint256 pnl);
    event AssetMaxExposureUpdated(address indexed asset, uint256 maxExposure);
    event UserMaxLeverageUpdated(address indexed user, uint256 maxLeverage);
    event UserMaxExposureUpdated(address indexed user, uint256 maxExposure);
    event LiquidationsToggled(bool enabled);
    
    // ============ 构造函数 ============
    
    constructor(address _vault, address _synth) {
        vault = GenesisVault(_vault);
        synth = GenesisSynth(_synth);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, msg.sender);
    }
    
    // ============ 核心验证函数 ============
    
    /**
     * @notice 验证开仓参数
     */
    function validatePosition(
        address user,
        address syntheticAsset,
        uint256 leverage,
        uint256 collateralAmount
    ) external view returns (bool) {
        // 验证杠杆范围
        require(leverage >= MIN_LEVERAGE && leverage <= MAX_LEVERAGE, "RiskManager: Leverage out of range");
        require(leverage <= userMaxLeverage[user] || userMaxLeverage[user] == 0, "RiskManager: Leverage exceeds user limit");
        
        // 验证资产是否激活
        (, , , , , , bool isActive) = synth.syntheticAssets(syntheticAsset);
        require(isActive, "RiskManager: Asset not active");
        
        // 验证用户敞口限制
        uint256 userTotalExposure = getUserTotalExposure(user);
        require(
            userTotalExposure + (collateralAmount * leverage / 1e18) <= userMaxExposure[user] || userMaxExposure[user] == 0,
            "RiskManager: User exposure exceeds limit"
        );
        
        // 验证资产总敞口限制
        uint256 assetTotalExposure = getAssetTotalExposure(syntheticAsset);
        require(
            assetTotalExposure + (collateralAmount * leverage / 1e18) <= assetMaxExposure[syntheticAsset] || assetMaxExposure[syntheticAsset] == 0,
            "RiskManager: Asset exposure exceeds limit"
        );
        
        return true;
    }
    
    /**
     * @notice 检查是否需要清算
     */
    function checkLiquidation(address user, address syntheticAsset) public view returns (bool needsLiquidation, uint256 healthFactor) {
        GenesisVault.Position memory pos = vault.getUserPosition(user, syntheticAsset);
        if (pos.syntheticAmount == 0) return (false, 1e18);
        
        int256 pnl = vault.calculatePnL(user, syntheticAsset);
        uint256 currentCollateral;
        
        if (pnl >= 0) {
            currentCollateral = pos.collateral + uint256(pnl);
        } else {
            uint256 loss = uint256(-pnl);
            currentCollateral = loss > pos.collateral ? 0 : pos.collateral - loss;
        }
        
        uint256 positionValue = (pos.syntheticAmount * synth.getPrice(syntheticAsset)) / 1e18;
        healthFactor = positionValue == 0 ? 1e18 : (currentCollateral * 1e18) / positionValue;
        
        needsLiquidation = healthFactor < LIQUIDATION_THRESHOLD && liquidationsEnabled;
        
        return (needsLiquidation, healthFactor);
    }
    
    /**
     * @notice 执行清算 (由 Keeper 调用)
     */
    function liquidatePosition(address user, address syntheticAsset) external onlyRole(KEEPER_ROLE) {
        (bool needsLiquidation, ) = checkLiquidation(user, syntheticAsset);
        require(needsLiquidation, "RiskManager: No liquidation needed");
        
        // 平仓
        vault.closePosition(user, syntheticAsset);
        
        // 收取清算手续费
        GenesisVault.Position memory pos = vault.getUserPosition(user, syntheticAsset);
        uint256 fee = (pos.collateral * LIQUIDATION_FEE) / 1e18;
        
        emit LiquidationTriggered(user, syntheticAsset, pos.collateral, fee);
    }
    
    // ============ 计算函数 ============
    
    /**
     * @notice 获取用户总敞口
     */
    function getUserTotalExposure(address user) public view returns (uint256) {
        // 简化实现：实际需要遍历所有活跃仓位
        // 生产环境需要维护用户活跃资产列表
        return 0;
    }
    
    /**
     * @notice 获取资产总敞口
     */
    function getAssetTotalExposure(address asset) public view returns (uint256) {
        // 简化实现：实际需要遍历所有用户的该资产仓位
        return 0;
    }
    
    // ============ 管理函数 ============
    
    /**
     * @notice 设置资产最大敞口
     */
    function setAssetMaxExposure(address asset, uint256 maxExposure) external onlyRole(ADMIN_ROLE) {
        assetMaxExposure[asset] = maxExposure;
        emit AssetMaxExposureUpdated(asset, maxExposure);
    }
    
    /**
     * @notice 设置用户最大杠杆
     */
    function setUserMaxLeverage(address user, uint256 maxLeverage) external onlyRole(ADMIN_ROLE) {
        require(maxLeverage >= MIN_LEVERAGE && maxLeverage <= MAX_LEVERAGE, "RiskManager: Leverage out of range");
        userMaxLeverage[user] = maxLeverage;
        emit UserMaxLeverageUpdated(user, maxLeverage);
    }
    
    /**
     * @notice 设置用户最大敞口
     */
    function setUserMaxExposure(address user, uint256 maxExposure) external onlyRole(ADMIN_ROLE) {
        userMaxExposure[user] = maxExposure;
        emit UserMaxExposureUpdated(user, maxExposure);
    }
    
    /**
     * @notice 开关清算功能
     */
    function toggleLiquidations(bool enabled) external onlyRole(ADMIN_ROLE) {
        liquidationsEnabled = enabled;
        emit LiquidationsToggled(enabled);
    }
    
    /**
     * @notice 更新 Vault 和 Synth 地址
     */
    function updateAddresses(address _vault, address _synth) external onlyRole(ADMIN_ROLE) {
        require(_vault != address(0) && _synth != address(0), "RiskManager: Invalid address");
        vault = GenesisVault(_vault);
        synth = GenesisSynth(_synth);
    }
}
