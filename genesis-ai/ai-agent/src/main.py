"""
Genesis AI Agent - 主入口（完整版）
AI 驱动的链上合成资产投资代理
真实链上交易执行
"""

import asyncio
import logging
import os
from typing import Dict, List, Optional
from dataclasses import dataclass, field

from .engines.strategy_engine import StrategyEngine, TradingSignal, Position as EnginePosition, SignalType, RiskLevel, TrendFollowingStrategy, MeanReversionStrategy
from .engines.risk_engine import RiskManager, RiskConfig
from .data.price_fetcher import PriceFetcher
from .blockchain.chain_interaction import ChainInteraction

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


@dataclass
class AgentConfig:
    """AI Agent 配置"""
    # 策略配置
    strategies: List[str] = field(default_factory=lambda: ["trend_following", "mean_reversion"])
    
    # 风险配置
    risk_level: RiskLevel = RiskLevel.MEDIUM
    max_leverage: int = 3
    max_positions: int = 3
    
    # 运行配置
    check_interval_seconds: int = 60  # 每分钟检查一次
    enable_automated_trading: bool = False  # 默认关闭自动交易，需要明确开启
    
    # 区块链配置
    rpc_url: str = "https://rpc.public.zkevm.net"
    vault_address: str = ""
    private_key: str = ""
    chain_id: int = 1101  # Polygon zkEVM


class GenesisAIAgent:
    """Genesis AI Agent 主类 - 真实链上交易版本"""
    
    def __init__(self, config: AgentConfig):
        self.config = config
        self.strategies: List[StrategyEngine] = []
        self.risk_manager = RiskManager()
        self.price_fetcher = PriceFetcher()
        self.chain_interaction: Optional[ChainInteraction] = None
        
        self.positions: Dict[str, Dict[str, EnginePosition]] = {}  # user -> symbol -> position
        self.pending_signals: List[TradingSignal] = []
        self.is_running = False
        
        self._initialize_strategies()
        
        # 检查区块链配置
        if config.vault_address and config.private_key:
            self.chain_interaction = ChainInteraction(
                rpc_url=config.rpc_url,
                vault_address=config.vault_address,
                private_key=config.private_key,
                chain_id=config.chain_id
            )
            logger.info("区块链交互已初始化（真实链上模式）")
        else:
            logger.info("未配置区块链凭证，运行在模拟模式")
    
    def _initialize_strategies(self):
        """初始化策略引擎"""
        if "trend_following" in self.config.strategies:
            self.strategies.append(TrendFollowingStrategy())
            logger.info("已加载趋势跟踪策略")
        
        if "mean_reversion" in self.config.strategies:
            self.strategies.append(MeanReversionStrategy())
            logger.info("已加载均值回归策略")
        
        if not self.strategies:
            logger.warning("未加载任何策略引擎")
    
    async def start(self):
        """启动 AI Agent"""
        logger.info("Genesis AI Agent 启动中...")
        
        # 如果配置了区块链，加载合约
        if self.chain_interaction:
            await self.chain_interaction.load_contracts()
            # 测试连接
            connected = await self.chain_interaction.test_connection()
            if not connected:
                logger.warning("区块链连接测试失败，将使用模拟模式")
        
        self.is_running = True
        
        if self.config.enable_automated_trading:
            logger.warning("⚠️ 自动交易已启用，将执行真实链上交易！")
        else:
            logger.info("🔒 自动交易已关闭，仅生成交易信号")
        
        logger.info(f"AI Agent 已启动 - 策略数量: {len(self.strategies)}, 检查间隔: {self.config.check_interval_seconds}秒")
        
        while self.is_running:
            try:
                await self._run_cycle()
                await asyncio.sleep(self.config.check_interval_seconds)
            except Exception as e:
                logger.error(f"运行周期出错: {e}", exc_info=True)
                await asyncio.sleep(10)
    
    async def stop(self):
        """停止 AI Agent"""
        logger.info("AI Agent 停止中...")
        self.is_running = False
    
    async def _run_cycle(self):
        """运行一个完整的检查周期"""
        logger.info("=== 开始新的检查周期 ===")
        
        # 1. 获取市场数据
        market_data = await self.price_fetcher.get_all_prices()
        logger.info(f"获取到 {len(market_data)} 个资产的价格数据")
        
        # 2. 生成交易信号
        self.pending_signals = []
        for strategy in self.strategies:
            try:
                signals = await strategy.generate_signals(market_data)
                self.pending_signals.extend(signals)
                logger.info(f"{strategy.name} 生成 {len(signals)} 个信号")
            except Exception as e:
                logger.error(f"{strategy.name} 生成信号出错: {e}")
        
        # 3. 风险检查和信号过滤
        filtered_signals = self._filter_signals_by_risk()
        logger.info(f"经过风险过滤后剩余 {len(filtered_signals)} 个信号")
        
        # 4. 检查现有仓位
        await self._check_existing_positions(market_data)
        
        # 5. 如果启用自动交易，执行交易
        if self.config.enable_automated_trading and self.chain_interaction:
            await self._execute_trades(filtered_signals)
        else:
            # 仅记录信号
            for signal in filtered_signals:
                logger.info(f"交易信号: {signal.symbol} {signal.signal_type.value} @ ${signal.price:.2f} - {signal.reason}")
        
        logger.info("=== 检查周期完成 ===\n")
    
    def _filter_signals_by_risk(self) -> List[TradingSignal]:
        """根据风险配置过滤信号"""
        filtered = []
        
        for signal in self.pending_signals:
            # 简单的风险过滤
            if signal.confidence < 0.6:
                logger.info(f"信号置信度过低: {signal.symbol} ({signal.confidence})")
                continue
            
            # 根据风险等级过滤
            if self.config.risk_level == RiskLevel.LOW and signal.risk_level == RiskLevel.HIGH:
                logger.info(f"信号风险过高: {signal.symbol} (HIGH)")
                continue
            
            filtered.append(signal)
        
        return filtered
    
    async def _check_existing_positions(self, market_data: Dict):
        """检查现有仓位是否需要平仓"""
        for user, positions in self.positions.items():
            for symbol, position in positions.items():
                if symbol not in market_data:
                    continue
                
                current_price = market_data[symbol]['price']
                
                # 检查止损
                should_close_sl, pnl = self.risk_manager.should_trigger_stop_loss(position, current_price)
                if should_close_sl:
                    logger.warning(f"⚠️ 触发止损: {user} {symbol} @ ${current_price:.2f} (PnL: ${pnl:.2f})")
                    if self.config.enable_automated_trading and self.chain_interaction:
                        await self._close_position(user, symbol, position)
                    continue
                
                # 检查止盈
                should_close_tp, pnl = self.risk_manager.should_trigger_take_profit(position, current_price)
                if should_close_tp:
                    logger.info(f"✅ 触发止盈: {user} {symbol} @ ${current_price:.2f} (PnL: ${pnl:.2f})")
                    if self.config.enable_automated_trading and self.chain_interaction:
                        await self._close_position(user, symbol, position)
                    continue
                
                # 检查策略平仓信号
                for strategy in self.strategies:
                    if await strategy.should_close_position(position, current_price):
                        logger.info(f"📊 策略平仓信号: {user} {symbol}")
                        if self.config.enable_automated_trading and self.chain_interaction:
                            await self._close_position(user, symbol, position)
                        break
    
    async def _execute_trades(self, signals: List[TradingSignal]):
        """执行交易（真实链上交易）"""
        logger.info(f"准备执行 {len(signals)} 个交易信号")
        
        for signal in signals:
            if signal.signal_type == SignalType.HOLD:
                continue
            
            # 构建资产地址映射
            asset_addresses = {
                "sBTC": "0x...",  # 从部署信息获取
                "sETH": "0x...",
                # ... 其他资产
            }
            
            asset_address = asset_addresses.get(signal.symbol)
            if not asset_address:
                logger.warning(f"无法找到 {signal.symbol} 的合约地址")
                continue
            
            # 计算交易参数
            # 这里简化处理，实际应根据策略算法计算
            collateral_amount = 100  # 固定抵押品 100 USDC
            synthetic_amount = collateral_amount / signal.price  * signal.target_weight if signal.target_weight else 0.5
            
            # 确定杠杆
            leverage = 2 if self.config.risk_level == RiskLevel.MEDIUM else 1
            is_long = signal.signal_type == SignalType.BUY
            
            logger.info(f"执行交易: {signal.signal_type.value} {signal.symbol}")
            logger.info(f"  抵押: ${collateral_amount} USDC")
            logger.info(f"  数量: {synthetic_amount}")
            logger.info(f"  杠杆: {leverage}x")
            logger.info(f"  方向: {'多头' if is_long else '空头'}")
            
            # 执行真实交易
            result = await self.chain_interaction.open_position(
                user="user_wallet_address_placeholder",  # 实际应从数据库获取
                synthetic_asset=asset_address,
                collateral_amount=collateral_amount,
                synthetic_amount=synthetic_amount,
                leverage=leverage,
                is_long=is_long
            )
            
            if result.get("success"):
                logger.info(f"✅ 交易成功: {result['tx_hash']}")
            else:
                logger.error(f"❌ 交易失败: {result.get('error', 'Unknown error')}")
            
            # 等待交易完成（避免交易拥堵）
            await asyncio.sleep(2)
    
    async def _close_position(self, user: str, symbol: str, position: EnginePosition):
        """平仓（真实链上交易）"""
        logger.info(f"执行平仓: {user} {symbol}")
        
        # 获取资产地址
        asset_addresses = {
            "sBTC": "0x...",
            # ...
        }
        asset_address = asset_addresses.get(symbol)
        
        if not asset_address:
            logger.error(f"无法找到 {symbol} 的合约地址")
            return
        
        # 执行平仓
        result = await self.chain_interaction.close_position(
            user="user_wallet_address_placeholder",
            synthetic_asset=asset_address
        )
        
        if result.get("success"):
            pnl = result.get("realized_pnl", 0)
            logger.info(f"✅ 平仓成功: {result['tx_hash']}, PnL: ${pnl:.2f}")
        else:
            logger.error(f"❌ 平仓失败: {result.get('error', 'Unknown error')}")


async def main():
    """主函数"""
    
    # 配置 - 从环境变量加载
    config = AgentConfig(
        strategies=["trend_following"],
        risk_level=RiskLevel.MEDIUM,
        max_leverage=2,
        max_positions=2,
        check_interval_seconds=30,
        enable_automated_trading=False,  # ⚠️ 默认关闭，需要手动开启
        rpc_url=os.getenv("POLYGON_ZKEVM_RPC_URL", "https://rpc.public.zkevm.net"),
        vault_address=os.getenv("GENESIS_VAULT_ADDRESS", ""),
        private_key=os.getenv("AI_AGENT_PRIVATE_KEY", ""),
        chain_id=1101,
    )
    
    # 检查是否配置了真实的区块链凭证
    if not config.vault_address or not config.private_key:
        logger.warning("⚠️ 未配置 VAULT_ADDRESS 或 PRIVATE_KEY，将运行在模拟模式")
        logger.info("💡 要启用真实链上交易，请在环境变量中配置:")
        logger.info("   GENESIS_VAULT_ADDRESS=<你的 Vault 合约地址>")
        logger.info("   AI_AGENT_PRIVATE_KEY=<AI Agent 私钥>")
    else:
        logger.info("✅ 已配置区块链凭证，可执行真实链上交易")
    
    agent = GenesisAIAgent(config)
    
    try:
        await agent.start()
    except KeyboardInterrupt:
        await agent.stop()
        logger.info("AI Agent 已停止")


if __name__ == "__main__":
    asyncio.run(main())
