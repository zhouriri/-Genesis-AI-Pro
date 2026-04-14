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

# 构建 API（修复 TypeScript）
echo "📦 编译 API..."
cd api && npm run build > /dev/null 2>&1 && cd ..

# 启动 API（使用 PORT=4000 避免端口冲突）
echo "📡 启动 API 服务..."
PORT=4000 node api/dist/index.js > logs/api.log 2>&1 &
API_PID=$!
echo "   API: http://localhost:4000 (PID: $API_PID)"

# 等待 API 就绪
sleep 3

# 启动 Web
echo ""
echo "🌐 启动 Web 服务..."
cd web && PORT=3001 npm run dev > ../logs/web.log 2>&1 &
WEB_PID=$!
echo "   Web: http://localhost:3001 (PID: $WEB_PID)"

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
echo ""
echo "停止服务: ./stop.sh"
echo ""
