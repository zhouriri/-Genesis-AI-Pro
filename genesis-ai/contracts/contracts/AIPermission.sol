// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title AIPermission
 * @notice AI 授权管理合约
 * @dev 管理 Session Key、权限额度、操作日志
 */
contract AIPermission is AccessControl {
    
    // ============ 常量 ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    uint256 public constant MAX_VALIDITY = 30 days; // 最长有效期 30 天
    uint256 public constant MIN_VALIDITY = 1 hours; // 最短有效期 1 小时
    
    // ============ 数据结构 ============
    
    /// @notice Session Key 权限
    struct SessionKey {
        address owner;                // 所有者
        address aiAgent;              // AI Agent 地址
        uint256 maxAmount;            // 最大操作金额 (USDC, 6位精度)
        uint256 spentAmount;          // 已使用金额
        uint256 dailyLimit;          // 每日限制
        uint256 spentToday;           // 今日使用
        uint256 validUntil;            // 有效期
        bool isLongTerm;              // 是否长期授权
        bool isRevoked;               // 是否已撤销
        uint256 createdAt;            // 创建时间
        uint256 lastSpentAt;          // 最后使用时间
    }
    
    /// @notice 授权类型
    enum PermissionType {
        TRADE,                        // 交易
        WITHDRAW,                     // 取款
        DELEGATE                      // 委托
    }
    
    // ============ 状态变量 ============
    
    mapping(bytes32 => SessionKey) public sessionKeys;
    mapping(address => bytes32[]) public userSessions; // 用户的所有 Session
    
    // ============ 事件 ============
    
    event SessionKeyCreated(
        bytes32 indexed sessionId,
        address indexed user,
        address indexed aiAgent,
        uint256 maxAmount,
        uint256 validUntil,
        bool isLongTerm
    );
    
    event SessionKeyUsed(
        bytes32 indexed sessionId,
        address indexed aiAgent,
        uint256 amount,
        PermissionType permission,
        uint256 timestamp
    );
    
    event SessionKeyRevoked(bytes32 indexed sessionId, address revokedBy);
    event SessionKeyExpired(bytes32 indexed sessionId);
    
    // ============ 核心函数 ============
    
    /**
     * @notice 创建 Session Key
     * @param aiAgent AI Agent 地址
     * @param maxAmount 最大操作金额
     * @param duration 有效期 (秒)
     * @param isLongTerm 是否长期授权
     */
    function createSessionKey(
        address aiAgent,
        uint256 maxAmount,
        uint256 duration,
        bool isLongTerm
    ) external returns (bytes32 sessionId) {
        require(aiAgent != address(0), "AIPermission: Invalid AI agent");
        require(maxAmount > 0, "AIPermission: Amount must be positive");
        require(duration >= MIN_VALIDITY && duration <= MAX_VALIDITY, "AIPermission: Duration out of range");
        
        // 生成唯一 Session ID
        sessionId = keccak256(abi.encode(
            msg.sender,
            aiAgent,
            block.timestamp,
            maxAmount,
            isLongTerm,
            block.prevrandao
        ));
        
        require(sessionKeys[sessionId].owner == address(0), "AIPermission: Session already exists");
        
        SessionKey storage session = sessionKeys[sessionId];
        session.owner = msg.sender;
        session.aiAgent = aiAgent;
        session.maxAmount = maxAmount;
        session.dailyLimit = isLongTerm ? maxAmount / 30 : maxAmount; // 长期授权按 30 天拆分每日限额
        session.spentAmount = 0;
        session.spentToday = 0;
        session.validUntil = block.timestamp + duration;
        session.isLongTerm = isLongTerm;
        session.isRevoked = false;
        session.createdAt = block.timestamp;
        session.lastSpentAt = 0;
        
        userSessions[msg.sender].push(sessionId);
        
        emit SessionKeyCreated(sessionId, msg.sender, aiAgent, maxAmount, session.validUntil, isLongTerm);
    }
    
    /**
     * @notice AI Agent 执行操作前验证权限
     */
    function validateAndExecute(
        bytes32 sessionId,
        uint256 amount,
        PermissionType permission
    ) external returns (bool success) {
        SessionKey storage session = sessionKeys[sessionId];
        
        // 基础验证
        require(session.owner != address(0), "AIPermission: Session does not exist");
        require(session.aiAgent == msg.sender, "AIPermission: Not authorized AI agent");
        require(!session.isRevoked, "AIPermission: Session revoked");
        require(block.timestamp < session.validUntil, "AIPermission: Session expired");
        require(amount > 0, "AIPermission: Amount must be positive");
        
        // 重置每日限额（如果过了一天）
        _resetDailySpentIfNeeded(session);
        
        // 金额验证
        require(session.spentAmount + amount <= session.maxAmount, "AIPermission: Exceeds max total amount");
        require(session.spentToday + amount <= session.dailyLimit, "AIPermission: Exceeds daily limit");
        
        // 取款需要额外验证
        if (permission == PermissionType.WITHDRAW) {
            require(session.isLongTerm, "AIPermission: Withdraw only allowed for long-term sessions");
            require(amount <= session.dailyLimit / 2, "AIPermission: Withdraw amount exceeds daily limit");
        }
        
        // 更新使用记录
        session.spentAmount += amount;
        session.spentToday += amount;
        session.lastSpentAt = block.timestamp;
        
        emit SessionKeyUsed(sessionId, msg.sender, amount, permission, block.timestamp);
        
        return true;
    }
    
    /**
     * @notice 用户撤销 Session Key
     */
    function revokeSession(bytes32 sessionId) external {
        SessionKey storage session = sessionKeys[sessionId];
        require(session.owner == msg.sender || hasRole(ADMIN_ROLE, msg.sender), "AIPermission: Not authorized to revoke");
        require(!session.isRevoked, "AIPermission: Session already revoked");
        
        session.isRevoked = true;
        emit SessionKeyRevoked(sessionId, msg.sender);
    }
    
    /**
     * @notice 批量撤销用户的所有 Session
     */
    function revokeAllUserSessions() external {
        bytes32[] storage sessions = userSessions[msg.sender];
        for (uint256 i = 0; i < sessions.length; i++) {
            SessionKey storage session = sessionKeys[sessions[i]];
            if (!session.isRevoked && block.timestamp < session.validUntil) {
                session.isRevoked = true;
                emit SessionKeyRevoked(sessions[i], msg.sender);
            }
        }
    }
    
    /**
     * @notice 获取用户的所有有效 Session Keys
     */
    function getUserActiveSessions(address user) external view returns (bytes32[] memory) {
        bytes32[] storage allSessions = userSessions[user];
        uint256 activeCount = 0;
        
        // 先统计有效数量
        for (uint256 i = 0; i < allSessions.length; i++) {
            SessionKey storage session = sessionKeys[allSessions[i]];
            if (!session.isRevoked && block.timestamp < session.validUntil) {
                activeCount++;
            }
        }
        
        // 收集有效 Session
        bytes32[] memory activeSessions = new bytes32[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allSessions.length; i++) {
            SessionKey storage session = sessionKeys[allSessions[i]];
            if (!session.isRevoked && block.timestamp < session.validUntil) {
                activeSessions[index] = allSessions[i];
                index++;
            }
        }
        
        return activeSessions;
    }
    
    /**
     * @notice 获取 Session 的剩余额度
     */
    function getSessionRemaining(bytes32 sessionId) external view returns (uint256 remainingTotal, uint256 remainingToday) {
        SessionKey storage session = sessionKeys[sessionId];
        require(session.owner != address(0), "AIPermission: Session does not exist");
        
        if (session.isRevoked || block.timestamp >= session.validUntil) {
            return (0, 0);
        }
        
        remainingTotal = session.maxAmount > session.spentAmount ? session.maxAmount - session.spentAmount : 0;
        
        uint256 spentToday = _isSameDay(session.lastSpentAt, block.timestamp) ? session.spentToday : 0;
        remainingToday = session.dailyLimit > spentToday ? session.dailyLimit - spentToday : 0;
        
        return (remainingTotal, remainingToday);
    }
    
    // ============ 内部函数 ============
    
    /**
     * @notice 如果过了一天，重置今日使用额度
     */
    function _resetDailySpentIfNeeded(SessionKey storage session) internal {
        if (session.lastSpentAt > 0 && !_isSameDay(session.lastSpentAt, block.timestamp)) {
            session.spentToday = 0;
        }
    }
    
    /**
     * @notice 判断两个时间是否在同一天 (UTC)
     */
    function _isSameDay(uint256 timestamp1, uint256 timestamp2) internal pure returns (bool) {
        uint256 day1 = timestamp1 / 1 days;
        uint256 day2 = timestamp2 / 1 days;
        return day1 == day2;
    }
    
    // ============ 管理函数 ============
    
    /**
     * @notice 管理员撤销过期 Session (垃圾回收)
     */
    function cleanupExpiredSessions(address user, uint256 limit) external onlyRole(ADMIN_ROLE) {
        bytes32[] storage sessions = userSessions[user];
        uint256 cleaned = 0;
        
        for (uint256 i = 0; i < sessions.length && cleaned < limit; i++) {
            SessionKey storage session = sessionKeys[sessions[i]];
            if (!session.isRevoked && block.timestamp >= session.validUntil) {
                session.isRevoked = true;
                emit SessionKeyExpired(sessions[i]);
                cleaned++;
            }
        }
    }
}
