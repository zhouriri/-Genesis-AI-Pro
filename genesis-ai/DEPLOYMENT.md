# 部署指南

本文档介绍如何将 Genesis AI 部署到生产环境。

## 📋 部署前检查清单

- [ ] 所有代码已测试通过
- [ ] 安全审计完成
- [ ] 环境变量已配置
- [ ] 私钥和密钥已安全存储
- [ ] 数据库已创建
- [ ] 域名和 SSL 证书已准备

## 🚀 测试网部署

### 1. 配置环境变量

```bash
cd contracts
cp .env.example .env
```

编辑 `.env` 文件：
```bash
PRIVATE_KEY=your_amoy_testnet_private_key
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
POLYGONSCAN_API_KEY=your_api_key
```

### 2. 部署合约

```bash
npx hardhat run scripts/deploy.ts --network amoy
```

### 3. 验证部署

```bash
npx hardhat verify --network amoy <CONTRACT_ADDRESS> --constructor-args <ARGS>
```

## 🌐 生产环境部署

### 1. 服务器要求

- **操作系统**: Ubuntu 20.04+ / Debian 11+
- **Node.js**: >= 18.x
- **Python**: >= 3.10
- **PostgreSQL**: >= 14
- **内存**: >= 2GB
- **磁盘**: >= 20GB SSD

### 2. 环境配置

#### 安装依赖

```bash
# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -

# 安装 Python
sudo apt update
sudo apt install -y python3 python3-pip python3-venv

# 安装 PostgreSQL
sudo apt install -y postgresql postgresql-contrib
```

#### 创建数据库

```bash
sudo -u postgres psql
CREATE DATABASE genesis_ai;
\q
```

#### 配置环境变量

```bash
# API 配置
DATABASE_URL=postgresql://user:password@localhost:5432/genesis_ai
NODE_ENV=production
PORT=4000

# 前端配置
NEXT_PUBLIC_API_URL=https://api.your-domain.com

# 合约配置
PRIVATE_KEY=your_production_private_key
POLYGON_ZKEVM_RPC_URL=https://rpc.public.zkevm.net
USDC_ADDRESS=real_usdc_address
PYTH_ADDRESS=real_pyth_address
```

### 3. 构建和部署

#### 构建合约

```bash
cd contracts
npm run compile
```

#### 构建后端

```bash
cd api
npm run build
NODE_ENV=production DATABASE_URL=... npm start
```

#### 构建前端

```bash
cd web
npm run build
npm start
```

### 4. 配置 Nginx (反向代理)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://localhost:3001;
    }
}
```

### 5. 配置 SSL (使用 Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 6. 配置进程管理器

使用 PM2 管理进程：

```bash
npm install -g pm2

# API
pm2 start "cd api && npm start" --name "genesis-api"

# Web
pm2 start "cd web && npm start" --name "genesis-web"

# 保存进程列表
pm2 save

# 设置开机自启
pm2 startup
```

## 🔒 安全最佳实践

1. **私钥管理**
   - 使用环境变量或密钥管理服务
   - 永远不要将私钥提交到版本控制
   - 生产环境使用硬件钱包

2. **网络安全**
   - 启用 HTTPS
   - 配置防火墙
   - 限制 API 访问速率

3. **智能合约安全**
   - 部署前进行安全审计
   - 设置合理的权限控制
   - 监控合约事件

4. **数据库安全**
   - 定期备份
   - 设置强密码
   - 限制网络访问

## 📊 监控和日志

### 日志收集

使用 PM2 的日志功能：

```bash
pm2 logs genesis-api
pm2 logs genesis-web
```

### 监控指标

- 服务运行状态
- API 响应时间
- 数据库连接数
- 错误率

## 🚨 故障排查

### API 无法启动

1. 检查端口占用：`lsof -i :4000`
2. 检查数据库连接
3. 查看日志：`pm2 logs genesis-api`

### 合约交互失败

1. 检查私钥配置
2. 验证 RPC URL
3. 检查合约地址

### 前端无法连接 API

1. 检查 NEXT_PUBLIC_API_URL
2. 检查 CORS 配置
3. 检查网络连接

## 🔄 更新部署

### 更新合约

1. 修改合约代码
2. 运行测试
3. 部署新版本
4. 更新前端配置

### 更新 API/Web

```bash
git pull
npm install
npm run build
pm2 reload all
```

## 📞 技术支持

遇到问题？请通过以下方式联系：
- GitHub Issues: https://github.com/your-username/genesis-ai/issues
- 邮箱: support@genesis-ai.com
