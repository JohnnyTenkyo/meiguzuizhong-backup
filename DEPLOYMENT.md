# 美股智能分析系统 - 完整部署指南

## 项目概述

**美股智能分析系统** (meiguzuizhong) 是一个全栈 Web 应用，提供美国股市实时数据分析、智能推荐、技术指标分析和社交媒体追踪等功能。

### 核心特性

- **实时股票数据** - 支持股票搜索、行情查询、K线图表展示
- **智能推荐系统** - 基于梯子、禅动、缠论、买卖动能等多维度技术指标的推荐算法
- **板块分析** - 8 个主题板块（AI、半导体、比特币、量子计算、存储、稀土、云计算、能源）
- **自选股管理** - 账号绑定的自选股功能，支持跨设备同步
- **社交媒体追踪** - Twitter 和 Truth Social 信息流集成
- **回测系统** - 虚拟账户、历史模拟、K线回放、指标验证
- **VIP 信息流** - 重要人物（政治、科技、金融、商业）的实时动态追踪

---

## 技术栈

### 前端
- **框架**: React 19 + TypeScript
- **样式**: Tailwind CSS 4 + shadcn/ui
- **状态管理**: TanStack React Query + tRPC
- **路由**: Wouter
- **图表**: Lightweight Charts + Recharts
- **表单**: React Hook Form + Zod

### 后端
- **运行时**: Node.js (ES Module)
- **框架**: Express 4
- **RPC**: tRPC 11
- **数据库**: MySQL (Drizzle ORM)
- **认证**: JWT + bcryptjs
- **任务调度**: node-cron

### 外部 API
- **股票数据**: Finnhub、AlphaVantage、Yahoo Finance
- **社交媒体**: Twitter API、Truth Social RSS
- **加密货币**: CoinGecko
- **技术分析**: FOCI MCP

---

## 部署前准备

### 1. 系统要求

- **Node.js**: v22.13.0 或更高版本
- **包管理器**: pnpm 10.4.1+
- **数据库**: MySQL 8.0+ 或 TiDB
- **内存**: 至少 2GB RAM
- **磁盘**: 至少 500MB 可用空间

### 2. 环境变量配置

在部署前，需要配置以下环境变量。创建 `.env` 文件或通过系统环境变量设置：

```bash
# 数据库连接
DATABASE_URL=mysql://user:password@host:3306/database_name

# API 密钥
FINNHUB_API_KEY=your_finnhub_api_key
ALPHAVANTAGE_API_KEY=your_alphavantage_api_key
TWITTER_AUTH_TOKEN=your_twitter_bearer_token
TWITTER_CT0=your_twitter_ct0_token
ALPHAMOE_FOCI_API_KEY=your_foci_api_key
MASSIVE_API_KEY=your_massive_api_key

# 应用配置
JWT_SECRET=your_jwt_secret_key_min_32_chars
NODE_ENV=production
PORT=3000

# Manus 内置 API（如果使用 Manus 平台）
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_forge_api_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im

# 应用信息
VITE_APP_ID=your_app_id
VITE_APP_TITLE=美股智能分析
VITE_APP_LOGO=https://your-domain.com/logo.png
OWNER_NAME=Your Name
OWNER_OPEN_ID=your_open_id
```

### 3. 获取 API 密钥

#### Finnhub
1. 访问 https://finnhub.io
2. 注册免费账户
3. 获取 API Key

#### AlphaVantage
1. 访问 https://www.alphavantage.co
2. 申请免费 API Key
3. 注意：免费版本有 5 个请求/分钟的限制

#### Twitter API
1. 访问 https://developer.twitter.com
2. 创建应用并获取 Bearer Token
3. 获取 CT0 Token（用于 X API v2）

#### FOCI API
1. 联系 FOCI 团队获取 API Key
2. 用于获取重要人物的实时动态

---

## 本地开发部署

### 1. 克隆项目

```bash
git clone <repository-url>
cd meiguzuizhong
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

```bash
# 创建 .env 文件
cp .env.example .env

# 编辑 .env 文件，填入实际的 API 密钥和数据库连接字符串
nano .env
```

### 4. 初始化数据库

```bash
# 生成迁移脚本
pnpm drizzle-kit generate

# 执行迁移
pnpm drizzle-kit migrate
```

### 5. 启动开发服务器

```bash
pnpm dev
```

服务器将在 `http://localhost:3000` 启动。

### 6. 开发工作流

```bash
# 运行类型检查
pnpm check

# 运行测试
pnpm test

# 代码格式化
pnpm format
```

---

## 生产部署

### 1. 构建应用

```bash
pnpm build
```

这将生成：
- `dist/` - 打包后的前端资源（Vite 输出）
- `dist/index.js` - 后端服务器（esbuild 输出）

### 2. 启动生产服务器

```bash
# 设置环境变量
export NODE_ENV=production
export DATABASE_URL=mysql://...
export JWT_SECRET=...
# ... 其他环境变量

# 启动服务器
pnpm start
```

### 3. 使用 PM2 管理进程（推荐）

```bash
# 全局安装 PM2
npm install -g pm2

# 启动应用
pm2 start dist/index.js --name meiguzuizhong

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs meiguzuizhong

# 重启应用
pm2 restart meiguzuizhong
```

### 4. 使用 Docker 部署

创建 `Dockerfile`：

```dockerfile
FROM node:22-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package 文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["pnpm", "start"]
```

构建和运行 Docker 镜像：

```bash
# 构建镜像
docker build -t meiguzuizhong:latest .

# 运行容器
docker run -d \
  --name meiguzuizhong \
  -p 3000:3000 \
  -e DATABASE_URL=mysql://... \
  -e JWT_SECRET=... \
  -e FINNHUB_API_KEY=... \
  # ... 其他环境变量
  meiguzuizhong:latest
```

### 5. 使用 Docker Compose

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: mysql://root:password@mysql:3306/meiguzuizhong
      JWT_SECRET: ${JWT_SECRET}
      FINNHUB_API_KEY: ${FINNHUB_API_KEY}
      ALPHAVANTAGE_API_KEY: ${ALPHAVANTAGE_API_KEY}
      TWITTER_AUTH_TOKEN: ${TWITTER_AUTH_TOKEN}
      TWITTER_CT0: ${TWITTER_CT0}
      ALPHAMOE_FOCI_API_KEY: ${ALPHAMOE_FOCI_API_KEY}
      MASSIVE_API_KEY: ${MASSIVE_API_KEY}
    depends_on:
      - mysql
    restart: always

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: meiguzuizhong
    volumes:
      - mysql_data:/var/lib/mysql
    restart: always

volumes:
  mysql_data:
```

启动 Docker Compose：

```bash
docker-compose up -d
```

### 6. 配置反向代理（Nginx）

创建 `/etc/nginx/sites-available/meiguzuizhong`：

```nginx
upstream meiguzuizhong {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    # 重定向 HTTP 到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 证书配置
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 代理配置
    location / {
        proxy_pass http://meiguzuizhong;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/meiguzuizhong /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. SSL 证书配置（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot certonly --nginx -d your-domain.com

# 自动续期（cron job）
sudo certbot renew --quiet
```

---

## 数据库管理

### 1. 数据库初始化

```bash
# 连接到 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE meiguzuizhong CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户
CREATE USER 'meiguzuizhong'@'localhost' IDENTIFIED BY 'strong_password';

# 授予权限
GRANT ALL PRIVILEGES ON meiguzuizhong.* TO 'meiguzuizhong'@'localhost';
FLUSH PRIVILEGES;
```

### 2. 数据库备份

```bash
# 备份数据库
mysqldump -u meiguzuizhong -p meiguzuizhong > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复数据库
mysql -u meiguzuizhong -p meiguzuizhong < backup_20240101_120000.sql
```

### 3. 数据库监控

```bash
# 查看数据库大小
SELECT table_schema, ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'meiguzuizhong'
GROUP BY table_schema;

# 查看表行数
SELECT table_name, table_rows
FROM information_schema.tables
WHERE table_schema = 'meiguzuizhong'
ORDER BY table_rows DESC;
```

---

## 监控和日志

### 1. 应用日志

```bash
# 查看最近的日志
tail -f /var/log/meiguzuizhong.log

# 使用 PM2 查看日志
pm2 logs meiguzuizhong
```

### 2. 性能监控

```bash
# 使用 PM2 监控
pm2 monit

# 查看进程状态
pm2 status
```

### 3. 错误追踪

应用使用以下日志级别：
- `error` - 严重错误
- `warn` - 警告信息
- `info` - 信息日志
- `debug` - 调试信息

---

## 常见问题排查

### 1. 数据库连接失败

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**解决方案**：
- 检查 MySQL 服务是否运行：`sudo systemctl status mysql`
- 检查 DATABASE_URL 是否正确
- 检查数据库用户权限

### 2. API 密钥无效

```
Error: Invalid API Key
```

**解决方案**：
- 验证 API 密钥是否正确复制
- 检查 API 密钥是否过期
- 确认 API 配额未超限

### 3. 内存不足

```
JavaScript heap out of memory
```

**解决方案**：
- 增加 Node.js 堆内存：`NODE_OPTIONS=--max-old-space-size=4096 pnpm start`
- 优化数据库查询
- 使用 Redis 缓存

### 4. 端口被占用

```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案**：
```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

---

## 性能优化

### 1. 数据库优化

```sql
-- 为常用查询字段添加索引
CREATE INDEX idx_user_id ON watchlist(userId);
CREATE INDEX idx_symbol ON watchlist(symbol);
CREATE INDEX idx_created_at ON watchlist(createdAt);

-- 定期清理过期数据
DELETE FROM cache WHERE expiresAt < NOW();
```

### 2. 缓存策略

- 使用 Redis 缓存股票数据（TTL: 5 分钟）
- 缓存用户自选股列表（TTL: 1 小时）
- 缓存板块数据（TTL: 1 小时）

### 3. CDN 配置

- 将静态资源（JS、CSS、图片）上传到 CDN
- 在 `index.html` 中配置 CDN URL
- 使用内容哈希作为文件名后缀

### 4. 代码分割

应用已配置自动代码分割：
- 路由级别的代码分割
- 组件级别的代码分割
- 第三方库的分离打包

---

## 安全建议

### 1. 环境变量安全

- 不要在版本控制中提交 `.env` 文件
- 使用强密码和复杂的 JWT Secret
- 定期轮换 API 密钥

### 2. 数据库安全

- 使用强密码
- 限制数据库访问 IP
- 定期备份数据库
- 启用 SSL 连接

### 3. API 安全

- 实施速率限制
- 验证所有输入数据
- 使用 HTTPS 传输
- 定期更新依赖包

### 4. 应用安全

```bash
# 定期检查依赖包漏洞
pnpm audit

# 更新依赖包
pnpm update

# 检查已知漏洞
npm audit fix
```

---

## 扩展和维护

### 1. 添加新的股票数据源

在 `server/adapters/` 中创建新的适配器：

```typescript
// server/adapters/newSource.ts
export async function fetchStockData(symbol: string) {
  // 实现数据获取逻辑
}
```

### 2. 添加新的技术指标

在 `server/indicators/` 中添加新的指标计算函数：

```typescript
// server/indicators/newIndicator.ts
export function calculateNewIndicator(data: OHLCV[]) {
  // 实现指标计算逻辑
}
```

### 3. 添加新的前端页面

创建新的页面组件：

```typescript
// client/src/pages/NewPage.tsx
export function NewPage() {
  return <div>New Page Content</div>;
}
```

在 `client/src/App.tsx` 中注册路由。

---

## 备份和恢复

### 1. 完整备份

```bash
# 备份数据库
mysqldump -u meiguzuizhong -p meiguzuizhong > db_backup.sql

# 备份应用文件
tar -czf app_backup.tar.gz /path/to/meiguzuizhong

# 备份环境变量
cp .env .env.backup
```

### 2. 恢复备份

```bash
# 恢复数据库
mysql -u meiguzuizhong -p meiguzuizhong < db_backup.sql

# 恢复应用文件
tar -xzf app_backup.tar.gz

# 恢复环境变量
cp .env.backup .env
```

---

## 支持和反馈

如有问题或建议，请：

1. 查看 [项目文档](./README.md)
2. 检查 [常见问题](#常见问题排查)
3. 提交 Issue 或 Pull Request
4. 联系技术支持团队

---

## 版本信息

- **项目版本**: 1.0.0
- **最后更新**: 2026-03-03
- **部署指南版本**: 1.0.0

---

## 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

