# SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CrossChainBridge
 * @notice 跨链桥接合约 - 支持多链 USDC 资产转移
 * @dev 集成 LayerZero 实现跨链消息传递
 */
contract CrossChainBridge is AccessControl {
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // 跨链配置
    struct ChainConfig {
        uint16 chainId;
        uint16 endpointId;
        uint64 minAmount;
        uint64 maxAmount;
        uint256 fee;         // 跨链手续费
        bytes32 vaultAddress;  // 目标链上的 Vault 地址
    }
    
    // 跨链状态
    struct CrossChainTransfer {
        bytes32 transferId;
        address user;
        uint16 sourceChain;
        uint16 destChain;
        address asset;
        uint256 amount;
        uint256 fee;
        uint256 timestamp;
        bool completed;
    }
    
    // 状态变量
    IERC20 public immutable usdc;
    
    mapping(uint16 => ChainConfig) public chainConfigs;  // chainId => 配置
    mapping(bytes32 => CrossChainTransfer) public transfers;  // transferId => 跨链转移
    
    bytes32[] public transferIds;  // 所有跨链转移 ID 列表
    
    // LayerZero 相关
    address public lzEndpoint;
    bytes32 public lzChannelId;
    
    uint256 public constant MIN_TRANSFER = 10 * 1e6;  // 最小跨链金额 ($10)
    uint256 public constant MAX_TRANSFER = 10000 * 1e6;  // 最大跨链金额 ($10,000)
    
    // 事件
    event CrossChainTransferInitiated(
        bytes32 indexed transferId,
        address indexed user,
        uint16 sourceChain,
        uint16 destChain,
        address asset,
        uint256 amount,
        uint256 fee
    );
    
    event CrossChainTransferCompleted(
        bytes32 indexed transferId,
        uint256 amount,
        uint256 receivedAmount,
        address indexed user
    );
    
    event ChainConfigUpdated(uint16 indexed chainId, address vaultAddress);
    
    event TransferFailed(bytes32 indexed transferId, string reason);
    
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Only admin");
        _;
    }
    
    constructor(
        IERC20 _usdc,
        address _lzEndpoint,
        bytes32 _lzChannelId
    ) {
        usdc = _usdc;
        lzEndpoint = _lzEndpoint;
        lzChannelId = _lzChannelId;
        
        _grantRole(ADMIN_ROLE, msg.sender);
        
        // 初始化默认链配置
        chainConfigs[1101] = ChainConfig({
            chainId: 1101,  // Polygon zkEVM
            endpointId: 1,
            minAmount: MIN_TRANSFER,
            maxAmount: MAX_TRANSFER,
            fee: 1 * 1e6,  // $1 手续费
            vaultAddress: 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
        });
        
        chainConfigs[42161] = ChainConfig({
            chainId: 42161,  // Arbitrum
            endpointId: 2,
            minAmount: MIN_TRANSFER,
            maxAmount: MAX_TRANSFER,
            fee: 2 * 1e6,  // $2 手续费
            vaultAddress: address(0)  // 待部署
        });
    }
    
    /**
     * @notice 配置目标链的 Vault 地址
     */
    function setVaultAddress(
        uint16 chainId,
        address vaultAddress
    ) external onlyAdmin {
        ChainConfig storage config = chainConfigs[chainId];
        require(config.vaultAddress != address(0), "Vault already set");
        
        config.vaultAddress = vaultAddress;
        chainConfigs[chainId] = config;
        
        emit ChainConfigUpdated(chainId, vaultAddress);
    }
    
    /**
     * @notice 发起跨链转账（仅 AI Agent 或 Admin 可调用）
     * @param user 用户地址
     * @param sourceChain 源链 ID
     * @param destChain 目标链 ID
     * @param amount 转账金额 (6 位精度)
     * @return transferId 跨链转移 ID
     */
    function initiateCrossChain(
        address user,
        uint16 sourceChain,
        uint16 destChain,
        uint256 amount
    ) external onlyAuthorizedAI returns (bytes32) {
        require(chainConfigs[sourceChain].vaultAddress != address(0), "Source chain not configured");
        require(chainConfigs[destChain].vaultAddress != address(0), "Destination chain not configured");
        
        ChainConfig memory sourceConfig = chainConfigs[sourceChain];
        ChainConfig memory destConfig = chainConfigs[destChain];
        
        require(amount >= sourceConfig.minAmount, "Amount below minimum");
        require(amount <= sourceConfig.maxAmount, "Amount exceeds maximum");
        require(amount >= destConfig.minAmount, "Destination amount below minimum");
        require(amount <= destConfig.maxAmount, "Destination amount exceeds maximum");
        
        // 锁定 USDC
        uint256 fee = sourceConfig.fee;
        require(usdc.balanceOf(user) >= amount + fee, "Insufficient USDC for transfer");
        
        // 转移到 Bridge 合约
        require(usdc.transferFrom(user, address(this), amount + fee), "USDC transfer failed");
        
        // 生成 Transfer ID
        bytes32 transferId = keccak256(abi.encode(user, sourceChain, destChain, block.timestamp));
        
        // 记录跨链转移
        transfers[transferId] = CrossChainTransfer({
            transferId: transferId,
            user: user,
            sourceChain: sourceChain,
            destChain: destChain,
            asset: address(usdc),
            amount: amount,
            fee: fee,
            timestamp: block.timestamp,
            completed: false
        });
        
        transferIds.push(transferId);
        
        emit CrossChainTransferInitiated(transferId, user, sourceChain, destChain, address(usdc), amount, fee);
        
        // TODO: 调用 LayerZero 发送跨链消息
        // _sendLayerZeroMessage(transferId, user, sourceChain, destChain, amount);
        
        return transferId;
    }
    
    /**
     * @notice 完成跨链转账
     * @param transferId 跨链转移 ID
     * @param receivedAmount 实际收到的金额
     */
    function completeCrossChain(
        bytes32 transferId,
        uint256 receivedAmount
    ) external onlyAuthorizedAI {
        require(!transfers[transferId].completed, "Transfer already completed");
        
        CrossChainTransfer storage transfer = transfers[transferId];
        
        // 计算实际到账金额（扣除手续费）
        uint256 fee = transfer.fee;
        uint256 netAmount = transfer.amount - fee;
        
        require(receivedAmount == netAmount, "Amount mismatch");
        
        transfer.completed = true;
        transfers[transferId] = netAmount;  // 存储实际到账金额
        
        // 将 USDC 转给用户
        usdc.transfer(address(this), transfer.user, receivedAmount);
        
        emit CrossChainTransferCompleted(transferId, transfer.amount, receivedAmount, transfer.user);
    }
    
    /**
     * @notice 检查跨链转移状态
     */
    function getTransferStatus(bytes32 transferId) external view returns (
        bool completed,
        uint256 amount,
        uint256 fee,
        uint256 timestamp
    ) {
        CrossChainTransfer storage transfer = transfers[transferId];
        return (
            transfer.completed,
            transfer.amount,
            transfer.fee,
            transfer.timestamp
        );
    }
    
    /**
     * @notice 获取用户的所有跨链历史
     */
    function getUserTransfers(address user, uint256 startFrom, uint256 limit) external view returns (
        bytes32[] memory transferIds,
        uint256 totalAmount,
        uint256 totalFee
    ) {
        // 简化版本：返回所有 transferId，前端可逐个查询详情
        bytes32[] memory userTransferIds;
        
        for (uint256 i = startFrom; i < startFrom + limit && i < transferIds.length; i++) {
            bytes32 transferId = transferIds[i];
            if (transfers[transferId].user == user && transfers[transferId].completed) {
                userTransferIds.push(transferId);
            }
        }
        
        // 计算总金额
        uint256 totalAmt = 0;
        uint256 totalFee = 0;
        for (bytes32 _tid : userTransferIds) {
            CrossChainTransfer memory t = transfers[_tid];
            totalAmt += t.amount;
            totalFee += t.fee;
        }
        
        return (userTransferIds, totalAmt, totalFee);
    }
    
    /**
     * @notice 获取支持的链列表
     */
    function getSupportedChains() external view returns (
        uint16[] memory chainIds
    ) {
        uint16[] memory chainIds;
        
        for (uint16 chainId in [1101, 42161]) {
            if (chainConfigs[chainId].vaultAddress != address(0)) {
                chainIds.push(chainId);
            }
        }
        
        return chainIds;
    }
    
    /**
     * @notice 获取链配置
     */
    function getChainConfig(uint16 chainId) external view returns (
        ChainConfig memory config
    ) {
        return chainConfigs[chainId];
    }
}
