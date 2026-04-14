"""
Genesis AI Agent - 风险管理引擎
负责仓位限制、止损止盈、清算检查
"""

from typing import Dict, Optional
from dataclasses import dataclass
import logging
from .strategy_engine import Position

logger = logging.getLogger(__name__)


@dataclass
class RiskConfig:
    """风险配置"""
    max_positions_per_user: int = 5
    max_leverage: int = 5
    max_position_size_usd: float = 10000.0
    max_total_exposure_usd: float = 50000.0
    stop_loss_percent: float = 0.10  # 10% 止损
    take_profit_percent: float = 0.20  # 20% 止盈
    liquidation_threshold: float = 0.80  # 80% 保证金率触发清算


class RiskManager:
    """风险管理引擎"""
    
    def __init__(self, config: RiskConfig = None):
        self.config = config or RiskConfig()
        self.user_positions: Dict[str, Dict[str, Position]] = {}  # user -> symbol -> position
        self.user_exposure: Dict[str, float] = {}  # user -> total exposure (USD)
    
    def validate_open_position(
        self,
        user: str,
        symbol: str,
        collateral_usd: float,
        leverage: int,
        current_price: float
    ) -> tuple[bool, str]:
        """
        验证开仓请求是否通过风险检查
        
        Returns:
            (is_valid, error_message)
        """
        # 检查杠杆限制
        if leverage > self.config.max_leverage:
            return False, f"杠杆超过限制: {leverage}x > {self.config.max_leverage}x"
        
        if leverage < 1:
            return False, "杠杆必须 >= 1x"
        
        # 检查仓位数量限制
        user_positions = self.user_positions.get(user, {})
        if len(user_positions) >= self.config.max_positions_per_user:
            return False, f"仓位数量超过限制: {len(user_positions)} >= {self.config.max_positions_per_user}"
        
        # 检查单个仓位大小限制
        position_value_usd = collateral_usd * leverage
        if position_value_usd > self.config.max_position_size_usd:
            return False, f"仓位规模超过限制: ${position_value_usd} > ${self.config.max_position_size_usd}"
        
        # 检查总敞口限制
        current_exposure = self.user_exposure.get(user, 0.0)
        if current_exposure + position_value_usd > self.config.max_total_exposure_usd:
            return False, f"总敞口超过限制: ${current_exposure + position_value_usd} > ${self.config.max_total_exposure_usd}"
        
        # 检查是否已有同资产仓位
        if symbol in user_positions:
            return False, f"已有 {symbol} 仓位，请先平仓"
        
        return True, "通过风险检查"
    
    def calculate_stop_loss(
        self,
        entry_price: float,
        side: str,
        leverage: int
    ) -> float:
        """
        计算止损价格
        
        Args:
            entry_price: 入场价格
            side: "long" | "short"
            leverage: 杠杆倍数
        
        Returns:
            止损价格
        """
        # 止损百分比根据杠杆调整
        # 高杠杆需要更紧的止损
        adjusted_stop_loss = self.config.stop_loss_percent / leverage
        
        if side == "long":
            return entry_price * (1 - adjusted_stop_loss)
        else:
            return entry_price * (1 + adjusted_stop_loss)
    
    def calculate_take_profit(
        self,
        entry_price: float,
        side: str,
        leverage: int
    ) -> float:
        """
        计算止盈价格
        
        Args:
            entry_price: 入场价格
            side: "long" | "short"
            leverage: 杠杆倍数
        
        Returns:
            止盈价格
        """
        # 止盈百分比根据杠杆调整
        # 高杠杆可以设置更紧的止盈
        adjusted_take_profit = self.config.take_profit_percent / max(leverage, 2)
        
        if side == "long":
            return entry_price * (1 + adjusted_take_profit)
        else:
            return entry_price * (1 - adjusted_take_profit)
    
    def should_trigger_stop_loss(
        self,
        position: Position,
        current_price: float
    ) -> tuple[bool, float]:
        """
        检查是否触发止损
        
        Returns:
            (should_close, realized_pnl)
        """
        stop_loss_price = self.calculate_stop_loss(
            position.entry_price,
            position.side,
            position.leverage
        )
        
        should_close = False
        
        if position.side == "long":
            if current_price <= stop_loss_price:
                should_close = True
        else:
            if current_price >= stop_loss_price:
                should_close = True
        
        if should_close:
            # 计算已实现盈亏
            if position.side == "long":
                pnl = (current_price - position.entry_price) / position.entry_price
            else:
                pnl = (position.entry_price - current_price) / position.entry_price
            
            realized_pnl = pnl * position.collateral
            return True, realized_pnl
        
        return False, 0.0
    
    def should_trigger_take_profit(
        self,
        position: Position,
        current_price: float
    ) -> tuple[bool, float]:
        """
        检查是否触发止盈
        
        Returns:
            (should_close, realized_pnl)
        """
        take_profit_price = self.calculate_take_profit(
            position.entry_price,
            position.side,
            position.leverage
        )
        
        should_close = False
        
        if position.side == "long":
            if current_price >= take_profit_price:
                should_close = True
        else:
            if current_price <= take_profit_price:
                should_close = True
        
        if should_close:
            # 计算已实现盈亏
            if position.side == "long":
                pnl = (current_price - position.entry_price) / position.entry_price
            else:
                pnl = (position.entry_price - current_price) / position.entry_price
            
            realized_pnl = pnl * position.collateral
            return True, realized_pnl
        
        return False, 0.0
    
    def check_liquidation(
        self,
        position: Position,
        current_price: float
    ) -> tuple[bool, float]:
        """
        检查是否需要清算
        
        Args:
            position: 持仓信息
            current_price: 当前价格
        
        Returns:
            (needs_liquidation, health_factor)
        """
        # 计算当前保证金率
        # Health Factor = (抵押品 + 未实现盈亏) / 仓位价值
        
        # 计算未实现盈亏
        if position.side == "long":
            unrealized_pnl = (current_price - position.entry_price) / position.entry_price
        else:
            unrealized_pnl = (position.entry_price - current_price) / position.entry_price
        
        pnl_usd = unrealized_pnl * position.collateral
        current_collateral = position.collateral + pnl_usd
        
        # 计算仓位价值
        position_value = position.size * current_price
        
        # 健康因子
        health_factor = current_collateral / position_value if position_value > 0 else 1.0
        
        # 如果健康因子低于阈值，需要清算
        needs_liquidation = health_factor < self.config.liquidation_threshold
        
        return needs_liquidation, health_factor
    
    def record_position(self, user: str, position: Position):
        """记录持仓"""
        if user not in self.user_positions:
            self.user_positions[user] = {}
        
        self.user_positions[user][position.symbol] = position
        
        # 更新用户总敞口
        position_value = position.size * position.entry_price
        if user not in self.user_exposure:
            self.user_exposure[user] = 0.0
        self.user_exposure[user] += position_value
    
    def remove_position(self, user: str, symbol: str):
        """移除持仓"""
        if user in self.user_positions and symbol in self.user_positions[user]:
            position = self.user_positions[user][symbol]
            position_value = position.size * position.entry_price
            
            del self.user_positions[user][symbol]
            
            # 更新用户总敞口
            self.user_exposure[user] -= position_value
