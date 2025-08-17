# MooncakeTV Docker 部署指南

本项目包含完整的 Docker Compose 设置，用于运行 MooncakeTV 及其所有必要服务。

## 包含的服务

- **Next.js 应用**: 您的 MooncakeTV 应用程序
- **Caddy**: 具有自动 HTTPS 的反向代理
- **PostgreSQL 16**: 数据库服务器
- **Redis**: 缓存和会话存储
- **pgweb**: 数据库管理界面

## 快速开始

1. **克隆并构建:**

   ```bash
   git clone https://github.com/MoonCakeTV/MoonCakeTV
   cd mooncaketv
   ```

2. **配置环境:**

   ```bash
   cp docker.env.example .env
   # 编辑 .env 文件进行配置
   ```

3. **启动所有服务:**

   ```bash
   docker compose --profile migrate up -d --build
   ```

4. **配置 DNS 记录:**

   在您的域名提供商处添加以下 DNS A 记录：

   ```dns
   yourdomain.com        A    YOUR_SERVER_IP_ADDRESS
   www.yourdomain.com    A    YOUR_SERVER_IP_ADDRESS
   pgweb.yourdomain.com  A    YOUR_SERVER_IP_ADDRESS
   ```

## 服务详情

### Caddy (反向代理)

- **端口**: 80 (HTTP), 443 (HTTPS)
- **功能**: 自动 HTTPS、压缩、安全头
- **配置**: `./caddy/Caddyfile`

**Caddy 配置详情:**

- **主应用**: 反向代理到 Next.js 应用 (端口 3000)
- **WWW 支持**: 同时处理 `domain.com` 和 `www.domain.com`
- **静态文件缓存**: `/_next/static/*`, `/favicon.ico`, `/robots.txt` 缓存 1 年
- **API 路由**: `/api/*` 禁用缓存
- **安全头**: 包含 HSTS、XSS 保护、内容类型保护等
- **数据库管理**: `pgweb.domain.com` 子域名访问 PgWeb

### PostgreSQL 16

- **端口**: 5432
- **数据库**: mooncaketv
- **用户**: mooncaketv
- **密码**: password (生产环境请修改!)
- **初始化脚本**: `./postgres/init/`

### Redis

- **端口**: 6379
- **持久化**: 启用 AOF
- **用途**: 缓存、会话、队列

### pgweb

- **端口**: 8081 (内部端口，通过 Caddy 代理)
- **访问方式**: 通过子域名 `pgweb.domain.com`
- **认证**: 使用数据库连接认证
- **用途**: PostgreSQL 数据库 Web 管理界面
