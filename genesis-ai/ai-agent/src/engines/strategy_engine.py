"""
Genesis AI Agent - 核心策略引擎
负责生成交易信号、执行仓位管理
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class SignalType(Enum):
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"


class RiskLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


@dataclass
class TradingSignal:
    """交易信号"""
    symbol: str
    signal_type: SignalType
    confidence: float  # 0.0 - 1.0
    price: float
    reason: str
    timestamp: int
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    risk_level: RiskLevel = RiskLevel.MEDIUM


@dataclass
class Position:
    """持仓信息"""
    symbol: str
    side: str  # "long" | "short"
    entry_price: float
    size: float
    collateral: float
    leverage: int
    pnl: float = 0.0


class StrategyEngine:
    """策略引擎基类"""
    
    def __init__(self, name: str, risk_level: RiskLevel = RiskLevel.MEDIUM):
        self.name = name
        self.risk_level = risk_level
        self.positions: Dict[str, Position] = {}
    
    async def generate_signals(self, market_data: Dict[str, Dict]) -> List[TradingSignal]:
        """
        根据市场数据生成交易信号
        
        Args:
            market_data: 市场数据 {symbol: {price, volume, ...}}
        
        Returns:
            交易信号列表
        """
        raise NotImplementedError
    
    async def should_close_position(self, position: Position, current_price: float) -> bool:
        """
        检查是否需要平仓
        
        Args:
            position: 持仓信息
            current_price: 当前价格
        
        Returns:
            是否需要平仓
        """
        return False


class TrendFollowingStrategy(StrategyEngine):
    """趋势跟踪策略"""
    
    def __init__(self):
        super().__init__("Trend Following", RiskLevel.MEDIUM)
        self.price_history: Dict[str, List[float]] = {}
    
    async def generate_signals(self, market_data: Dict[str, Dict]) -> List[TradingSignal]:
        """
        趋势跟踪策略逻辑:
        - 突破 20 日均线 -> 买入
        - 跌破 20 日均线 -> 卖出
        """
        signals = []
        
        for symbol, data in market_data.items():
            price = data['price']
            
            # 维护价格历史
            if symbol not in self.price_history:
                self.price_history[symbol] = []
            self.price_history[symbol].append(price)
            
            # 只保留最近 50 个价格点
            if len(self.price_history[symbol]) > 50:
                self.price_history[symbol] = self.price_history[symbol][-50:]
            
            # 计算移动平均线 (简单 20 日均线)
            if len(self.price_history[symbol]) >= 20:
                ma20 = sum(self.price_history[symbol][-20:]) / 20
                
                if price > ma20 * 1.02:  # 价格突破 MA20 2% 买入
                    signals.append(TradingSignal(
                        symbol=symbol,
                        signal_type=SignalType.BUY,
                        confidence=0.7,
                        price=price,
                        reason=f"价格突破 MA20 ({ma20:.2f})",
                        timestamp=int(time.time()),
                        risk_level=self.risk_level
                    ))
                elif price < ma20 * 0.98:  # 价格跌破 MA20 2% 卖出
                    signals.append(TradingSignal(
                        symbol=symbol,
                        signal_type=SignalType.SELL,
                        confidence=0.65,
                        price=price,
                        reason=f"价格跌破 MA20 ({ma20:.2f})",
                        timestamp=int(time.time()),
                        risk_level=self.risk_level
                    ))
        
        return signals
    
    async def should_close_position(self, position: Position, current_price: float) -> bool:
        """止损: 亏损超过 10%"""
        if position.side == "long":
            pnl = (current_price - position.entry_price) / position.entry_price
        else:
            pnl = (position.entry_price - current_price) / position.entry_price
        
        position.pnl = pnl * position.collateral
        return pnl < -0.10


class MeanReversionStrategy(StrategyEngine):
    """均值回归策略"""
    
    def __init__(self):
        super().__init__("Mean Reversion", RiskLevel.LOW)
        self.price_history: Dict[str, List[float]] = {}
    
    async def generate_signals(self, market_data: Dict[str, Dict]) -> List[TradingSignal]:
        """
        均值回归策略逻辑:
        - 价格低于 50 日均线 2% -> 买入
        - 价格高于 50 日均线 2% -> 卖出
        """
        signals = []
        
        for symbol, data in market_data.items():
            price = data['price']
            
            if symbol not in self.price_history:
                self.price_history[symbol] = []
            self.price_history[symbol].append(price)
            
            if len(self.price_history[symbol]) > 100:
                self.price_history[symbol] = self.price_history[symbol][-100:]
            
            if len(self.price_history[symbol]) >= 50:
                ma50 = sum(self.price_history[symbol][-50:]) / 50
                
                if price < ma50 * 0.98:  # 价格跌破 MA50 2% 买入
                    signals.append(TradingSignal(
                        symbol=symbol,
                        signal_type=SignalType.BUY,
                        confidence=0.6,
                        price=price,
                        reason=f"价格低于 MA50 ({ma50:.2f})，预期均值回归",
                        timestamp=int(time.time()),
                        risk_level=self.risk_level
                    ))
                elif price > ma50 * 1.02:  # 价格突破 MA50 2% 卖出
                    signals.append(TradingSignal(
                        symbol=symbol,
                        signal_type=SignalType.SELL,
                        confidence=0.6,
                        price=price,
                        reason=f"价格高于 MA50 ({ma50:.2f})，预期均值回归",
                        timestamp=int(time.time()),
                        risk_level=self.risk_level
                    ))
        
        return signals
    
    async def should_close_position(self, position: Position, current_price: float) -> bool:
        """止损: 亏损超过 5%"""
        if position.side == "long":
            pnl = (current_price - position.entry_price) / position.entry_price
        else:
            pnl = (position.entry_price - current_price) / position.entry_price
        
        position.pnl = pnl * position.collateral
        return pnl < -0.05
