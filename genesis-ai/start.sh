#!/bin/bash

echo "🚀 启动 Genesis AI 开发环境（所有服务）"
echo ""

# 启动 API
echo "📡 启动 API 服务..."
cd api
DATABASE_URL=sqlite:./data/genesis.db PORT=4000 PRICE_TEST_MODE=true npm run dev > ../logs/api.log 2>&1 &
API_PID=$!
echo "   API: http://localhost:4000 (PID: $API_PID)"

# 启动 Web
echo ""
echo "🌐 启动 Web 服务..."
cd web
PORT=3001 npm run dev > ../logs/web.log 2>&1 &
WEB_PID=$!
echo "   Web: http://localhost:3001 (PID: $WEB_PID)"

cd ..

echo ""
echo "✅ 所有服务已启动！"
echo ""
echo "查看日志："
echo "  API: tail -f logs/api.log"
echo "  Web: tail -f logs/web.log"
echo ""
echo "停止服务: ./stop.sh"
echo ""
echo "✨ 访问 Web: http://localhost:3001"
