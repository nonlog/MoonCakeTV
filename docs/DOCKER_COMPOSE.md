# MooncakeTV Docker 部署指南

本项目包含完整的 Docker Compose 设置，用于运行 MooncakeTV 及其所有必要服务。

## 包含的服务

- **Next.js 应用**: 您的 MooncakeTV 应用程序
- **Caddy**: 具有自动 HTTPS 的反向代理
- **PostgreSQL 16**: 数据库服务器
- **Redis**: 缓存和会话存储
- **PgAdmin**: 数据库管理界面（可选）

## 快速开始

1. **克隆并构建:**

   ```bash
   git clone https://github.com/MoonCakeTV/MoonCakeTV
   cd mooncaketv
   ```

2. **配置环境（可选）:**

   ```bash
   cp docker.env.example .env
   # 编辑 .env 文件进行配置
   ```

3. **启动所有服务:**

   ```bash
   docker compose --profile migrate up -d --build
   ```

4. **访问您的应用程序:**
   - 主应用: http://localhost
   - 数据库管理: http://pgweb.localhost
   - 健康检查: http://health.localhost
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

## 服务详情

### Caddy (反向代理)

- **端口**: 80 (HTTP), 443 (HTTPS)
- **功能**: 自动 HTTPS、压缩、安全头
- **配置**: `./caddy/Caddyfile`

**Caddy 配置详情:**

- **主应用**: 反向代理到 Next.js 应用 (端口 3000)
- **静态文件缓存**: `/_next/static/*`, `/favicon.ico`, `/robots.txt` 缓存 1 年
- **API 路由**: `/api/*` 禁用缓存
- **安全头**: 包含 HSTS、XSS 保护、内容类型保护等
- **数据库管理**: `pgweb.localhost` 子域名访问 PgWeb
- **健康检查**: `health.localhost` 端点

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

### PgAdmin

- **端口**: 5050
- **邮箱**: admin@mooncaketv.com
- **密码**: admin (生产环境请修改!)

## 生产环境部署

1. **更新密码:**

   ```bash
   # 编辑 compose.yml 并更改所有默认密码
   # 更新 POSTGRES_PASSWORD, PGADMIN_DEFAULT_PASSWORD
   ```

2. **配置域名:**

   ```bash
   # 设置 DOMAIN 环境变量
   export DOMAIN=yourdomain.com
   export TLS_EMAIL=admin@yourdomain.com
   ```

   配置完成后，您可以访问：
   - 主应用: https://yourdomain.com
   - 数据库管理: https://pgweb.yourdomain.com
   - 健康检查: https://health.yourdomain.com

3. **启用 HTTPS:**

   Caddy 会自动为您的域名申请和续期 Let's Encrypt SSL 证书。
   如需自定义 TLS 配置，请编辑 `caddy/Caddyfile`。

## 健康检查

所有服务都包含健康检查:

- PostgreSQL: `pg_isready` 命令
- Redis: `redis-cli ping`
- 应用: HTTP 端点检查（在您的应用中配置）

## 数据卷

- `postgres_data`: 数据库文件
- `redis_data`: Redis 持久化
- `pgadmin_data`: PgAdmin 设置
- `caddy_data`: SSL 证书
- `caddy_config`: Caddy 配置

## 网络

所有服务通过 `mooncake-web-network` 桥接网络通信，确保安全和隔离。

## 故障排除

1. **端口冲突**: 在 compose.yml 中更改端口映射
2. **权限问题**: 检查卷中的文件所有权
3. **数据库连接**: 确保 PostgreSQL 在应用启动前处于健康状态
4. **内存问题**: 增加 Docker 内存限制
