#!/bin/bash
# AI Agent 启动脚本

echo "🤖 启动 Genesis AI Agent..."

# 创建 .env 文件（如果不存在）
if [ ! -f ".env" ]; then
    cp .env.example .env 2>/dev/null || echo "请手动创建 .env 文件"
    echo "✅ 已创建 .env 配置文件"
fi

# 检查 Python 版本
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 未安装"
    exit 1
fi

# 创建虚拟环境
if [ ! -d "venv" ]; then
    echo "📦 创建 Python 虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
echo "📦 安装 Python 依赖..."
pip install -r requirements.txt --quiet

# 启动 AI Agent
echo "🚀 启动 AI Agent..."
python -m src.main
