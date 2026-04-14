# Genesis AI Telegram Bot - Phase 1 基础功能
# Python 3.10+
# 依赖: python-telegram-bot, python-dotenv, aiohttp, web3

import asyncio
import logging
import os
from datetime import datetime

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from telegram.ext.filters import filters
import aiohttp

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# API 配置
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:4000")

class TelegramBot:
    """Genesis AI Telegram Bot 服务类"""
    
    async def get_portfolio(self, user_wallet: str) -> dict:
        """获取用户组合数据"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{API_BASE_URL}/api/v1/portfolio",
                    params={"wallet_address": user_wallet}
                ) as response:
                    if response.status == 200:
                        return await response.json()
                    return {"error": "获取失败"}
        except Exception as e:
            logger.error(f"获取组合数据失败: {e}")
            return {"error": str(e)}
    
    async def get_strategies(self) -> dict:
        """获取可用策略列表"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{API_BASE_URL}/api/v1/strategies") as response:
                    if response.status == 200:
                        return await response.json()
                    return {"error": "获取失败"}
        except Exception as e:
            logger.error(f"获取策略列表失败: {e}")
            return {"error": str(e)}
    
    async def activate_strategy(self, wallet: str, strategy_type: str) -> dict:
        """激活策略"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{API_BASE_URL}/api/v1/strategies/activate",
                    json={"wallet_address": wallet, "strategy_type": strategy_type}
                ) as response:
                    if response.status == 200:
                        return await response.json()
                    return {"error": "激活失败"}
        except Exception as e:
            logger.error(f"激活策略失败: {e}")
            return {"error": str(e)}


# Bot 主类
class Bot:
    def __init__(self):
        self.genesis_bot = TelegramBot()
        self.application = Application.builder().token(os.getenv("TELEGRAM_BOT_TOKEN")).build()
    
    async def start_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """开始命令"""
        user = update.effective_user
        message = update.message
        
        welcome_text = f"""
🧬 **Genesis AI 欢迎你！**

我是 AI 驱动的链上合成资产投资平台。

📊 **支持投资资产：**
• 加密货币：sBTC, sETH, sSOL
• 美股：sAAPL, sTSLA, sNVDA, sGOOGL, sAMZN
• 大宗商品：sXAU, sXAG

🚀 **快速开始：**
1️⃣ 查看策略：`/strategies`
2️⃣ 激活策略：`/activate <策略类型>`
3️⃣ 查看组合：`/portfolio`
4️�️ 提取资金：`/withdraw <金额>`

📖 **帮助文档：** `/help`

💡 **提示：** AI Agent 7×24 自动执行策略，无需手动操作
        """
        
        await message.reply_text(welcome_text, parse_mode="Markdown")
    
    async def help_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """帮助命令"""
        help_text = """
📚 **Genesis AI 帮助**

🔹 **基础命令：**
`/start` - 开始使用
`/help` - 显示帮助
`/status` - 系统状态

🔹 **账户命令：**
`/portfolio` - 查看我的组合
`/balance` - 查看余额

🔹 **策略命令：**
`/strategies` - 查看可用策略
`/activate <策略类型>` - 激活策略
`/deactivate <策略类型>` - 停用策略
`/signals` - 查看 AI 信号

🔹 **市场命令：**
`/prices` - 查看价格
`/market` - 市场概览

🔹 **资金命令：**
`/withdraw <金额>` - 提取 USDC
`/history` - 交易历史

💡 **策略类型：**
• `conservative` - 保守型（3-8%/月，<5% 回撤）
• `balanced` - 平衡型（8-15%/月，<15% 回撤）
• `aggressive` - 激进型（15-30%/月，<30% 回撤）

💡 **提示：**
• 所有操作需要先连接钱包
• 策略激活后 AI 将自动执行
• 随时可以查看交易信号和收益
        """
        
        await message.reply_text(help_text, parse_mode="Markdown")
    
    async def status_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """系统状态"""
        # 检查 API 状态
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{API_BASE_URL}/health") as response:
                    api_status = "🟢 在线" if response.status == 200 else "🔴 离线"
        except:
            api_status = "🔴 离线"
        
        blockchain_status = "🟢 在线"  # 模拟
        
        status_text = f"""
📊 **Genesis AI 系统状态**

🖥️ **API 服务：** {api_status}
⛓️ **区块链：** {blockchain_status}
🤖 **AI Agent：** 🟢 运行中

📈 **服务时间：**
• API: 24/7
• 区块链: 24/7
• AI Agent: 24/7

📍 **当前时间：** {datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")}
        """
        
        await message.reply_text(status_text)
    
    async def strategies_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """查看策略列表"""
        result = await self.genesis_bot.get_strategies()
        
        if "error" in result:
            await message.reply_text(f"❌ 获取策略失败：{result['error']}")
            return
        
        strategies = result.get("data", {}).get("strategies", [])
        
        if not strategies:
            await message.reply_text("暂无可用策略")
            return
        
        strategies_text = """
📊 **可用 AI 策略**

"""
        
        for strategy in strategies:
            name = strategy.get("name", "未知")
            risk_level = strategy.get("risk_level", "medium")
            risk_level_map = {"low": "⭐", "medium": "⭐⭐", "high": "⭐⭐⭐"}
            risk_icon = risk_level_map.get(risk_level, "⭐⭐")
            
            performance = strategy.get("performance", {})
            last30d = performance.get("last30d", "N/A")
            sharpe = performance.get("sharpeRatio", "N/A")
            
            strategies_text += f"""
{risk_icon} **{name}**
   📈 近30天收益：{last30d}
   📊 夏普比率：{sharpe}
   💰 适合：{strategy.get('description', '无说明')}
   
"""
        
        strategies_text += f"\n💡 **激活命令：** `/activate {strategies[0]['type']}`"
        
        await message.reply_text(strategies_text, parse_mode="Markdown")
    
    async def activate_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """激活策略"""
        strategy_type = context.args[0] if len(context.args) > 0 else None
        
        if not strategy_type:
            await message.reply_text(
                "❌ 请指定策略类型\n\n用法：`/activate <策略类型>`\n\n示例：`/activate balanced`\n\n可用类型：\n• `conservative` - 保守型\n• `balanced` - 平衡型\n• `aggressive` - 激进型"
            )
            return
        
        valid_types = ["conservative", "balanced", "aggressive"]
        if strategy_type not in valid_types:
            await message.reply_text(f"❌ 无效的策略类型：{strategy_type}\n\n可用类型：{', '.join(valid_types)}")
            return
        
        result = await self.genesis_bot.activate_strategy("user_wallet_placeholder", strategy_type)
        
        if "error" in result:
            await message.reply_text(f"❌ 激活失败：{result['error']}")
            return
        
        success_text = f"""
✅ 策略已激活！

🎯 **策略类型：** {strategy_type}
📊 **预计收益：** {result.get('data', {}).get('expectedReturn', 'N/A')}
⚠️ **最大回撤：** {result.get('data', {}).get('maxDrawdown', 'N/A')}

🤖 **AI Agent 将开始自动执行策略**
📊 实时信号：`/signals`
📈 收益追踪：`/portfolio`
💡 **切换策略：`/activate <其他策略类型>`
        """
        
        await message.reply_text(success_text, parse_mode="Markdown")
    
    async def portfolio_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """查看组合"""
        result = await self.genesis_bot.get_portfolio("user_wallet_placeholder")
        
        if "error" in result:
            await message.reply_text(f"❌ 获取组合失败：{result['error']}")
            return
        
        data = result.get("data", {})
        
        total_value = data.get("totalValue", "$0.00")
        total_pnl = data.get("totalPnL", "$0.00")
        total_pnl_percent = data.get("totalPnLPercent", "0%")
        cash_balance = data.get("cashBalance", "$0.00")
        active_positions = data.get("activePositions", 0)
        
        positions = data.get("positions", [])
        positions_text = ""
        for pos in positions:
            positions_text += f"  • {pos.get('asset_symbol', 'N/A')}: {pos.get('size', '0')} @ ${pos.get('entry_price', '0')}\n"
        
        if not positions_text:
            positions_text = "  （无活跃仓位）"
        
        performance = data.get("performance", {})
        
        portfolio_text = f"""
📊 **我的投资组合**

💰 **总资产：** {total_value}
📈 **总盈亏：** {total_pnl} ({total_pnl_percent})
💵 **现金余额：** {cash_balance}
🔢 **活跃仓位：** {active_positions}

📈 **收益表现：**
• 24小时：{performance.get('last24h', 'N/A')}
• 7天：{performance.get('last7d', 'N/A')}
• 30天：{performance.get('last30d', 'N/A')}
• 90天：{performance.get('last90d', 'N/A')}

📋 **当前仓位：**
{positions_text}
        """
        
        await message.reply_text(portfolio_text, parse_mode="Markdown")
    
    async def withdraw_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """提现命令"""
        amount = context.args[0] if len(context.args) > 0 else None
        
        if not amount:
            await message.reply_text(
                "❌ 请输入提现金额\n\n用法：`/withdraw <金额>`\n\n示例：`/withdraw 100`"
            )
            return
        
        try:
            amount_float = float(amount)
        except ValueError:
            await message.reply_text("❌ 金额必须是数字")
            return
        
        if amount_float <= 0:
            await message.reply_text("❌ 金额必须大于 0")
            return
        
        # 提现逻辑（模拟）
        withdraw_text = f"""
💸 **提现申请已提交**

💵 **提现金额：** ${amount_float} USDC
🔗 **到账链：** Polygon zkEVM
⏱️ **预计时间：** 2-3 分钟

📋 **下一步：**
1. 等待链上确认
2. 钱包会弹出交易确认
3. 确认后资金到账

💡 **注意：** 提现前请确保已退出所有仓位
        """
        
        await message.reply_text(withdraw_text, parse_mode="Markdown")
    
    async def signals_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """查看 AI 信号"""
        # 模拟信号数据
        signals_text = """
🔥 **最新 AI 交易信号**

💡 **sBTC**
• 信号：持有 (HOLD)
• 价格：$67,542.30
• 置信度：72%
• 原因：BTC 在 67000 附近震荡，等待突破

💡 **sETH**
• 信号：买入 (BUY)
• 价格：$3,456.78
• 置信度：65%
• 原因：ETH 突破 3400 阻力位，看涨

💡 **sTSLA**
• 信号：持有 (HOLD)
• 价格：$245.67
• 置信度：58%
• 原因：技术形态整理中

📊 **信号说明：**
• 🟢 买入 (BUY) → 建议开多仓
• 🔴 卖出 (SELL) → 建议平仓
• ⚪️ 持有观望

💡 **提示：** 信号仅供参考，投资有风险
        """
        
        await message.reply_text(signals_text, parse_mode="Markdown")
    
    async def prices_handler(self, update: Update, context: Types.DEFAULT_TYPE):
        """查看价格"""
        # 模拟价格数据
        prices_text = """
📊 **实时价格**

💰 **加密货币：**
• sBTC: $67,542.30 🟢 +2.4%
• sETH: $3,456.78 🟢 +1.8%
• sSOL: $142.56 🔴 -1.6%

💰 **美股：**
• sAAPL: $178.32 🟢 +1.1%
• sTSLA: $245.67 🟢 +5.2%
• sNVDA: $875.42 🟢 +3.1%
• sGOOGL: $142.35 🔴 -0.6%
• sAMZN: $185.67 🟢 +1.2%

💰 **大宗商品：**
• sXAU: $2,314.50 🟢 +0.5%
• sXAG: $27.45 🔴 -0.8%

📈 **市场概况：**
• 总市值：$2.34T
• 24小时交易量：$85B
• AI Agent：🟢 运行中
        """
        
        await message.reply_text(prices_text, parse_mode="Markdown")
    
    async def market_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """市场概览"""
        market_text = """
📊 **市场概览**

💰 **总市值：** $2.34T
📈 **24小时交易量：** $85B
📊 **主要资产表现：**
• sBTC: +2.4% ($67,542)
• sETH: +1.8% ($3,456)
• sNVDA: +3.1% ($875)
• sTSLA: +5.2% ($245)

🤖 **AI Agent 状态：** 🟢 运行中
🔔 **网络状态：** 🟢 正常

💡 **提示：** 价格数据每分钟更新
        """
        
        await message.reply_text(market_text, parse_mode="Markdown")
    
    async def balance_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """查看余额"""
        balance_text = """
💰 **余额查询**

💵 **可用余额：** $0.00 USDC

💡 **提示：**
• 请先连接钱包查看真实余额
• 使用 `/connect <钱包地址>` 连接钱包
• 连接后可查看完整资产信息
        """
        
        await message.reply_text(balance_text)
    
    async def history_handler(self, update: Update, ContextTypes.ContextTypes.DEFAULT_TYPE):
        """交易历史"""
        history_text = """
📜 **交易历史**

💡 **提示：**
• 交易历史建议通过 Web 界面查看
• Web 界面支持导出 CSV
• 查看路径：http://localhost:3001/dashboard
        """
        
        await message.reply_text(history_text)
    
    async def unknown_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """未知命令"""
        await message.reply_text(
            f"❌ 未知命令：{update.message.text}\n\n💡 使用 `/help` 查看可用命令"
        )


def main():
    """启动 Telegram Bot"""
    # 从环境变量获取 Bot Token
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token:
        print("❌ 错误：TELEGRAM_BOT_TOKEN 环境变量未设置")
        print("请在 .env 文件中设置：")
        print("TELEGRAM_BOT_TOKEN=your_bot_token")
        return
    
    # 创建 Bot 实例
    bot = Bot()
    
    # 添加处理器
    bot.application.add_handler("start", filters=filters.Command & filters.ChatType.PRIVATE, callback=bot.start_handler)
    bot.application.add_handler("help", filters=filters.Command & filters.ChatType.PRIVATE, callback=bot.help_handler)
    bot.application.add_handler("status", filters=filters.Command & filters.ChatType.PRIVATE, callback=bot.status_handler)
    
    bot.application.add_handler("portfolio", filters=filters.Command & filters.ChatType.PRIVATE, callback=bot.portfolio_handler)
    bot.application.add_handler("balance", filters=filters.Command & filters.ChatType.PRIVATE, callback=bot.balance_handler)
    bot.application.add_handler("history", filters=filters.Command & filters.ChatType.PRIVATE, callback=bot.history_handler)
    
    bot.application.add_handler("strategies", filters=filters.Command & filters.ChatType.PRIVATE, callback=bot.strategies_handler)
    bot.application.add_handler("activate", filters=filters.Command & filters.ChatType.PRIVATE, callback=bot.activate_handler)
    bot.application.add_handler("deactivate", filters=filters.Command & filters.ChatType.PRIVATE, callback=lambda u, c: u.message.reply_text(f"✅ 已停用 {c.args[0] if c.args else '策略'} 策略")))
    
    bot.application.add_handler("signals", filters=filters.Command & filters.ChatType.PRIVATE, callback=bot.signals_handler)
    bot.application.add_handler("prices", filters=filters.Command & filters.ChatType.PRIVATE, callback=bot.prices_handler)
    bot.application.add_handler("market", filters=filters.Command & filters.ChatType.PRIVATE, callback=bot.market_handler)
    
    bot.application.add_handler("withdraw", filters=filters.Command & filters.ChatType.PRIVATE, callback=bot.withdraw_handler)
    bot.application.add_handler("deposit", filters=filters.Command & filters.ChatType.PRIVATE, callback=lambda u, c: u.message.reply_text("💳 充值功能：/deposit <金额> - 请通过 Web 界面完成充值")))
    bot.application.add_handler("connect", filters=filters.Command & filters.ChatType.PRIVATE, callback=bot.start_handler))  # 临时
    
    # 默认处理器
    bot.application.add_error_handler(bot.unknown_command)
    
    # 启动 Bot
    print("🚀 Genesis AI Telegram Bot 启动中...")
    print(f"📡 API 地址: {API_BASE_URL}")
    print(f"✅ Bot Token: {bot_token[:10]}...{bot_token[-4:]}")
    print("✅ Bot 已启动，等待命令...")
    
    try:
        bot.application.run_polling(allowed_updates=Update.Type.ALL_MESSAGE)
    except KeyboardInterrupt:
        print("\n👋 Bot 已停止")
    except Exception as e:
        print(f"\n❌ 错误：{e}")


if __name__ == "__main__":
    main()
