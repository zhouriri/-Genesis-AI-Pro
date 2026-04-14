#!/bin/bash

echo "====================================="
echo "🚀 启动 Genesis AI 开发环境"
echo "====================================="

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: Node.js 未安装"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: Python 未安装"
    echo "请先安装 Python 3.10+: https://www.python.org/"
    exit 1
fi

echo "✅ Python 版本: $(python3 --version)"

# 安装依赖
echo ""
echo "📦 安装依赖..."

echo "  1/3 安装合约依赖..."
cd contracts && npm install --silent

echo "  2/3 安装 API 依赖..."
cd ../api && npm install --silent

echo "  3/3 安装前端依赖..."
cd ../web && npm install --silent

cd ..

echo ""
echo "✅ 依赖安装完成！"

# 创建数据目录
mkdir -p api/data

# 创建环境配置文件示例
if [ ! -f "api/.env" ]; then
    cp api/.env.example api/.env 2>/dev/null || echo "DATABASE_URL=sqlite:./data/genesis.db
PORT=4000
PRICE_TEST_MODE=true" > api/.env
    echo "✅ 创建 API 配置文件: api/.env"
fi

if [ ! -f "web/.env.local" ]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > web/.env.local
    echo "✅ 创建前端配置文件: web/.env.local"
fi

echo ""
echo "====================================="
echo "✅ 环境准备完成！"
echo "====================================="
echo ""
echo "🚀 启动服务..."
echo ""
echo "启动命令："
echo "  开发模式: ./dev.sh"
echo ""
echo "手动启动："
echo "  API: cd api && npm run dev"
echo "  Web: cd web && npm run dev"
echo ""
