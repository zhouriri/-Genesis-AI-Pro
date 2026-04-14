// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// Pyth 预言机接口
interface IPyth {
    function getPrice(bytes32 id) external view returns (int64 price, uint64 conf);
    function getPriceNoOlderThan(bytes32 id, uint age) external view returns (int64 price, uint64 conf);
}

/**
 * @title GenesisSynth
 * @notice 合成资产核心合约
 * @dev 铸造/销毁合成资产，追踪真实资产价格
 */
contract GenesisSynth is AccessControl {
    
    // ============ 常量 ============
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // ============ 数据结构 ============
    
    /// @notice 合成资产信息
    struct SyntheticAsset {
        string name;                   // 名称 (e.g., "Synthetic Tesla")
        string symbol;                 // 符号 (e.g., "sTSLA")
        bytes32 priceFeedId;           // Pyth 价格 Feed ID
        uint256 maxSupply;             // 最大供应量
        uint256 totalSupply;           // 当前供应量
        uint8 decimals;                // 精度
        bool isActive;                 // 是否激活
    }
    
    // ============ 状态变量 ============
    
    mapping(address => SyntheticAsset) public syntheticAssets;
    address[] public assetList;
    mapping(bytes32 => address) public symbolToAsset; // 符号到资产地址的映射
    
    IPyth public pyth;                // Pyth 预言机
    address public vault;             // 资金库地址
    
    // ============ 事件 ============
    
    event AssetRegistered(address indexed asset, string name, string symbol, bytes32 priceFeedId);
    event AssetActivated(address indexed asset);
    event AssetDeactivated(address indexed asset);
    event Minted(address indexed user, address indexed asset, uint256 amount);
    event Burned(address indexed user, address indexed asset, uint256 amount);
    
    // ============ 构造函数 ============
    
    constructor(address _pyth) {
        pyth = IPyth(_pyth);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
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
    ) external onlyRole(ADMIN_ROLE) {
        // 生成资产地址
        address assetAddress = address(uint160(uint256(keccak256(abi.encode(symbol, block.timestamp)))));
        
        require(symbolToAsset[bytes32(abi.encodePacked(symbol))] == address(0), "GenesisSynth: Symbol already exists");
        require(priceFeedId != bytes32(0), "GenesisSynth: Invalid price feed ID");
        require(bytes(name).length > 0, "GenesisSynth: Name cannot be empty");
        require(bytes(symbol).length > 0, "GenesisSynth: Symbol cannot be empty");
        
        SyntheticAsset memory asset = SyntheticAsset({
            name: name,
            symbol: symbol,
            priceFeedId: priceFeedId,
            maxSupply: maxSupply,
            totalSupply: 0,
            decimals: 18,
            isActive: true
        });
        
        syntheticAssets[assetAddress] = asset;
        assetList.push(assetAddress);
        symbolToAsset[bytes32(abi.encodePacked(symbol))] = assetAddress;
        
        emit AssetRegistered(assetAddress, name, symbol, priceFeedId);
    }
    
    /**
     * @notice 激活/停用合成资产
     */
    function setAssetActive(address asset, bool isActive) external onlyRole(ADMIN_ROLE) {
        require(syntheticAssets[asset].priceFeedId != bytes32(0), "GenesisSynth: Asset not found");
        syntheticAssets[asset].isActive = isActive;
        
        if (isActive) {
            emit AssetActivated(asset);
        } else {
            emit AssetDeactivated(asset);
        }
    }
    
    /**
     * @notice 铸造合成资产 (由 Vault 调用)
     * @param user 用户地址
     * @param asset 资产地址
     * @param amount 数量
     */
    function mint(address user, address asset, uint256 amount) external onlyRole(MINTER_ROLE) {
        SyntheticAsset storage synthAsset = syntheticAssets[asset];
        require(synthAsset.isActive, "GenesisSynth: Asset not active");
        require(synthAsset.totalSupply + amount <= synthAsset.maxSupply, "GenesisSynth: Max supply exceeded");
        require(amount > 0, "GenesisSynth: Amount must be positive");
        
        synthAsset.totalSupply += amount;
        
        emit Minted(user, asset, amount);
    }
    
    /**
     * @notice 销毁合成资产
     */
    function burn(address user, address asset, uint256 amount) external onlyRole(BURNER_ROLE) {
        SyntheticAsset storage synthAsset = syntheticAssets[asset];
        require(synthAsset.totalSupply >= amount, "GenesisSynth: Insufficient supply");
        require(amount > 0, "GenesisSynth: Amount must be positive");
        
        synthAsset.totalSupply -= amount;
        
        emit Burned(user, asset, amount);
    }
    
    /**
     * @notice 获取资产当前价格
     * @param asset 资产地址
     * @return price 价格 (18位精度)
     */
    function getPrice(address asset) public view returns (uint256) {
        SyntheticAsset storage synthAsset = syntheticAssets[asset];
        require(synthAsset.isActive, "GenesisSynth: Asset not active");
        
        // 获取 Pyth 价格，最大允许 60 秒延迟
        (int64 price, ) = pyth.getPriceNoOlderThan(synthAsset.priceFeedId, 60);
        require(price > 0, "GenesisSynth: Invalid price");
        
        // 转换为 18 位精度 (Pyth 返回的是 8 位精度)
        return uint64(price) * 1e10;
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
    
    /**
     * @notice 根据符号获取资产地址
     */
    function getAssetBySymbol(string calldata symbol) external view returns (address) {
        return symbolToAsset[bytes32(abi.encodePacked(symbol))];
    }
    
    /**
     * @notice 获取所有激活的资产列表
     */
    function getActiveAssets() external view returns (address[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < assetList.length; i++) {
            if (syntheticAssets[assetList[i]].isActive) {
                activeCount++;
            }
        }
        
        address[] memory activeAssets = new address[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < assetList.length; i++) {
            if (syntheticAssets[assetList[i]].isActive) {
                activeAssets[index] = assetList[i];
                index++;
            }
        }
        
        return activeAssets;
    }
    
    // ============ 访问控制 ============
    
    /**
     * @notice 设置 Vault 地址 (授权 Vault 铸币/销毁权限)
     */
    function setVault(address _vault) external onlyRole(ADMIN_ROLE) {
        require(_vault != address(0), "GenesisSynth: Invalid vault address");
        vault = _vault;
        _grantRole(MINTER_ROLE, _vault);
        _grantRole(BURNER_ROLE, _vault);
    }
}
