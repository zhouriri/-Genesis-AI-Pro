#!/bin/bash

echo "🛑 停止 Genesis AI 开发环境..."
echo ""

# 停止所有 Node 进程
pkill -f "genesis.*api" 2>/dev/null || true
pkill -f "genesis.*web" 2>/dev/null || true

# 等待进程结束
sleep 2

echo "✅ 所有服务已停止"
