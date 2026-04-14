# AI Agent 模块

## 📋 说明

Genesis AI Agent，负责策略分析和自动交易执行。

## 🚀 快速开始

```bash
pip install -r requirements.txt
python -m src.main
```

## 📁 文件说明

- `src/`
  - `engines/` - 策略引擎和风险管理
  - `data/` - 价格数据获取
  - `blockchain/` - 区块链交互
  - `core/` - 核心功能

## 🔧 策略引擎

- `TrendFollowingStrategy` - 趋势跟踪策略
- `MeanReversionStrategy` - 均值回归策略
- `RiskManager` - 风险管理引擎

## 🧪 测试

```bash
pytest
```

## 🔗 配置

编辑 `src/main.py` 中的配置：
```python
config = AgentConfig(
    strategies=["trend_following"],
    risk_level=RiskLevel.MEDIUM,
    max_leverage=2,
    check_interval_seconds=30,
    enable_automated_trading=False,  # 默认关闭
)
```

## ⚠️ 重要

- `enable_automated_trading=False` 默认关闭自动交易
- 测试网环境使用前请先充分测试
- 真实交易前请先在测试网验证
