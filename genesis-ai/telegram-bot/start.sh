#!/bin/bash
# Telegram Bot 启动脚本

echo "🤖 启动 Genesis AI Telegram Bot..."

# 创建 .env 文件（如果不存在）
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件填入你的 TELEGRAM_BOT_TOKEN"
fi

# 检查 Python 版本
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 未安装"
    exit 1
fi

# 安装依赖
pip install -r requirements.txt --quiet

# 启动 Bot
echo "🚀 启动 Telegram Bot..."
python bot.py
