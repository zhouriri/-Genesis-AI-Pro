#!/bin/bash
# Genesis AI 启动脚本 - 启动所有服务

echo "🚀 启动 Genesis AI（所有服务）"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: Node.js 未安装"
    exit 1
fi

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: Python 未安装"
    exit 1
fi

# 创建数据目录
mkdir -p api/data logs

# 环境配置
if [ ! -f "api/.env" ]; then
    cat > api/.env << 'EOF'
PORT=4000
NODE_ENV=development
DATABASE_URL=sqlite:./data/genesis.db
PRICE_TEST_MODE=true
EOF
    echo "✅ 创建 api/.env"
fi

if [ ! -f "web/.env.local" ]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > web/.env.local
    echo "✅ 创建 web/.env.local"
fi

# 启动 API
echo "📡 启动 API 服务..."
cd api
DATABASE_URL=sqlite:./data/genesis.db PORT=4000 NODE_ENV=development npm run dev > ../logs/api.log 2>&1 &
API_PID=$!
echo "   API: http://localhost:4000 (PID: $API_PID)"

# 启动 Web
echo ""
echo "🌐 启动 Web 服务..."
cd ../web
PORT=3001 npm run dev > ../logs/web.log 2>&1 &
WEB_PID=$!
echo "   Web: http://localhost:3001 (PID: $WEB_PID)"

# 启动 Telegram Bot（后台）
cd ..
if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
    echo ""
    echo "📱 启动 Telegram Bot..."
    cd telegram-bot
    pip install -r requirements.txt -q 2>/dev/null
    python bot.py > ../logs/bot.log 2>&1 &
    BOT_PID=$!
    echo "   Telegram Bot (PID: $BOT_PID)"
fi

# 启动 AI Agent（可选，默认注释掉）
# cd ../ai-agent
# ./start.sh > ../logs/agent.log 2>&1 &

cd ..

echo ""
echo "======================================"
echo "✅ 所有服务已启动！"
echo "======================================"
echo ""
echo "访问地址："
echo "  Web:     http://localhost:3001"
echo "  API:     http://localhost:4000"
echo "  API健康: http://localhost:4000/health"
echo ""
echo "查看日志："
echo "  API:  tail -f logs/api.log"
echo "  Web:  tail -f logs/web.log"
echo "  Bot:  tail -f logs/bot.log"
echo ""
echo "停止服务: ./stop.sh"
echo ""
