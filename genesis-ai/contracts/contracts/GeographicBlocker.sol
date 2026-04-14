// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title GeographicBlocker
 * @notice 地理阻断合约 - 阻止受限地区用户访问
 * @dev 用于合规管理，阻止美国/英国/中国用户
 */
contract GeographicBlocker is AccessControl {
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    
    // 地理配置
    struct GeoConfig {
        string countryCode;  // 国家代码（ISO 3166-1，如 "US", "GB", "CN"）
        bool blocked;        // 是否阻断
        string reason;       // 阻断原因
        uint256 timestamp;  // 最后更新时间
    }
    
    // 黑名单
    mapping(address => bool) public blacklist;
    
    // 国家代码到配置的映射
    mapping(string => GeoConfig) public geoConfigs;
    
    // 黑名单国家代码
    string[] public blockedCountries;
    string[] public whitelistCountries;
    
    uint256 public constant BLACKLIST_SIZE_MAX = 1000;
    uint256 public constant WHITELIST_SIZE_MAX = 100;
    
    // 事件
    event UserBlocked(address indexed user, string countryCode, string reason);
    event UserUnblocked(address indexed user, string countryCode);
    event GeoConfigUpdated(string countryCode, bool blocked);
    event BlacklistUpdated(bool blocked);
    
    modifier onlyCompliance() {
        require(hasRole(COMPLIANCE_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender), "Only compliance or admin");
        _;
    }
    
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Only admin");
        _;
    }
    
    constructor() {
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ROLE, msg.sender);
        
        // 初始化默认黑名单
        blockedCountries = ["US", "GB", "CN", "KP", "IR", "SY"];
        
        // 初始化地理配置
        geoConfigs["US"] = GeoConfig({
            countryCode: "US",
            blocked: true,
            reason: "Regulatory restrictions",
            timestamp: block.timestamp
        });
        
        geoConfigs["GB"] = GeoConfig({
            countryCode: "GB",
            blocked: true,
            reason: "FCA regulations",
            timestamp: block.timestamp
        });
        
        geoConfigs["CN"] = GeoConfig({
            countryCode: "CN",
            blocked: true,
            reason: "Regulatory restrictions",
            timestamp: block.timestamp
        });
    }
    
    /**
     * @notice 添加黑名单国家
     */
    function addToBlacklist(string countryCode) external onlyAdmin {
        for (uint256 i = 0; i < blockedCountries.length; i++) {
            if (blockedCountries[i] == countryCode) {
                return;  // 已存在
            }
        }
        
        require(blockedCountries.length < BLACKLIST_SIZE_MAX, "Blacklist full");
        
        blockedCountries.push(countryCode);
        
        geoConfigs[countryCode] = GeoConfig({
            countryCode: countryCode,
            blocked: true,
            reason: "Regulatory restrictions",
            timestamp: block.timestamp
        });
        
        emit GeoConfigUpdated(countryCode, true);
        emit BlacklistUpdated(true);
    }
    
    /**
     * @notice 从黑名单移除国家
     */
    function removeFromBlacklist(string countryCode) external onlyAdmin {
        for (uint256 i = 0; i < blockedCountries.length; i++) {
            if (blockedCountries[i] == countryCode) {
                blockedCountries[i] = blockedCountries[blockedCountries.length - 1];
                break;
            }
        }
        
        geoConfigs[countryCode] = GeoConfig({
            countryCode: countryCode,
            blocked: false,
            reason: "",
            timestamp: block.timestamp
        });
        
        emit GeoConfigUpdated(countryCode, false);
        emit BlacklistUpdated(false);
    }
    
    /**
     * @notice 添加到白名单（例外列表）
     */
    function addToWhitelist(string countryCode) external onlyAdmin {
        for (uint256 i = 0; i < whitelistCountries.length; i++) {
            if (whitelistCountries[i] == countryCode) {
                return;
            }
        }
        
        require(whitelistCountries.length < WHITELIST_SIZE_MAX, "Whitelist full");
        
        whitelistCountries.push(countryCode);
        
        emit BlacklistUpdated(true);
    }
    
    /**
     * @notice 将用户加入黑名单
     */
    function blacklistUser(address user) external onlyCompliance {
        require(!blacklist[user], "User already blacklisted");
        blacklist[user] = true;
        
        emit UserBlocked(user, "unknown", "Blocked by compliance policy");
    }
    
    /**
     * @notice 将用户从黑名单移除
     */
    function unblockUser(address user) external onlyCompliance {
        require(blacklist[user], "User not blacklisted");
        blacklist[user] = false;
        
        emit UserUnblocked(user, "unknown");
    }
    
    /**
     * @notice 检查国家是否被阻断
     */
    function isCountryBlocked(string countryCode) public view returns (bool) {
        // 先检查白名单
        for (uint256 i = 0; i < whitelistCountries.length; i++) {
            if (whitelistCountries[i] == countryCode) {
                return false;  // 在白名单中，不阻断
            }
        }
        
        // 检查黑名单
        for (uint256 i = 0; i < blockedCountries.length; i++) {
            if (blockedCountries[i] == countryCode) {
                return true;  // 在黑名单中，阻断
            }
        }
        
        return false;
    }
    
    /**
     * @notice 检查用户是否被阻断
     */
    function isUserBlocked(address user) public view returns (bool) {
        return blacklist[user];
    }
    
    /**
     * @notice 检查用户和国家是否允许访问（综合检查）
     */
    function checkAccess(address user, string countryCode) external view returns (bool, string memory) {
        // 1. 检查用户黑名单
        if (blacklist[user]) {
            return (false, "User is blacklisted");
        }
        
        // 2. 检查国家阻断
        if (isCountryBlocked(countryCode)) {
            return (false, geoConfigs[countryCode].reason);
        }
        
        // 3. 检查白名单
        for (uint256 i = 0; i < whitelistCountries.length; i++) {
            if (whitelistCountries[i] == countryCode) {
                return (true, "Allowed (whitelisted)");
            }
        }
        
        return (true, "Allowed");
    }
    
    /**
     * @notice 获取所有黑名单国家
     */
    function getBlockedCountries() external view returns (string[] memory) {
        return blockedCountries;
    }
    
    /**
     * @notice 获取所有白名单国家
     */
    function getWhitelistedCountries() external view returns (string[] memory) {
        return whitelistCountries;
    }
    
    /**
     * @notice 获取国家配置
     */
    function getGeoConfig(string countryCode) external view returns (
        string memory countryCode,
        bool blocked,
        string memory reason
    ) {
        GeoConfig memory config = geoConfigs[countryCode];
        return (countryCode, config.blocked, config.reason);
    }
}
