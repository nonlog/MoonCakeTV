# MoonCakeTV 月饼TV

<div align="center">
  <img src="public/logo.png" alt="MoonCakeTV Logo" width="120">
</div>

> 🎬 **MoonCakeTV 月饼TV** - 一个超级简单的影视聚合搜索服务

<div align="center">

![License](https://img.shields.io/badge/License-MIT-green)
![Next.js](https://img.shields.io/badge/Next.js-15-000?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)

</div>

---

## 🚀 一键部署

```bash
curl -fsSL https://raw.githubusercontent.com/MoonCakeTV/MoonCakeTV/main/deploy.sh | bash
```

脚本会自动：

- 安装 Docker（如果没有）
- 生成配置文件
- 配置 SSL 证书（Caddy + Let's Encrypt）
- 启动服务

**支持系统**：Debian, Ubuntu, Rocky Linux, AlmaLinux, Oracle Linux, Arch Linux

---

## ✨ 特性

- 🔍 多源聚合搜索（苹果CMS v10 协议）
- ▶️ 在线播放（HLS.js）
- 💾 收藏功能
- 📝 观看历史
- ⚙️ 自定义视频源
- 📱 响应式设计
- 🌙 深色模式
- 🔒 可选密码保护
- 📁 文件存储（无需数据库）

---

## 🛠️ 手动部署

### Docker Compose

1. 创建目录并下载配置：

```bash
mkdir mooncaketv && cd mooncaketv
```

2. 创建 `.env`：

```bash
# JWT密钥（必需）
JWT_SECRET=your_random_secret_here

# 域名（必需，用于 HTTPS）
DOMAIN=mooncake.example.com
```

生成随机 JWT 密钥：

```bash
openssl rand -hex 32
```

3. 创建 `Caddyfile`：

```
{$DOMAIN} {
    reverse_proxy mooncaketv:3000
}
```

4. 创建 `compose.yml`：

```yaml
services:
  mooncaketv:
    image: ghcr.io/mooncaketv/mooncaketv:latest
    restart: unless-stopped
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    volumes:
      - ./data/mc_data:/app/data
    expose:
      - "3000"

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    environment:
      - DOMAIN=${DOMAIN}
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - ./data/caddy_data:/data
      - ./data/caddy_config:/config
    depends_on:
      - mooncaketv
```

5. 启动：

```bash
docker compose up -d
```

---

## ⚙️ 配置视频源

访问 `/settings` 页面，配置视频源。

格式：`名称 域名`（每行一个）

```
茅台资源 mtzy.tv
极速资源 jisuzy.com
```

支持 **苹果CMS v10** 协议的采集站。可在 [饭太硬](https://www.xn--sss604efuw.com/) 找到更多源。

---

## 📁 数据存储

所有数据存储在 `data/` 目录：

```
data/
├── mc_data/user-data.json   # 用户数据（收藏、历史、设置）
├── caddy_data/              # SSL 证书
└── caddy_config/            # Caddy 缓存
```

**备份**：

```bash
cp -r data/ backup/
```

**迁移**：

```bash
scp -r data/ user@new-server:/path/to/mooncaketv/
```

---

## 🔒 密码保护

首次访问 `/login` 页面可设置密码。

- **设置密码** = 需要登录才能访问
- **不设置密码** = 公开访问

**重置密码**：

```bash
# 编辑 data/mc_data/user-data.json，将 password_hash 设为空字符串 ""
```

---

## 📝 常用命令

```bash
# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 更新镜像
docker compose pull && docker compose up -d

# 停止服务
docker compose down
```

---

## 💻 本地开发

**系统要求**：Node.js >= 22.0.0

```bash
# 克隆代码
git clone https://github.com/MoonCakeTV/MoonCakeTV.git
cd MoonCakeTV

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 设置 JWT_SECRET

# 开发模式
npm run dev

# 代码检查
npm run lint

# 类型检查
npm run typecheck

# 构建
npm run build
```

---

## 📄 License

MIT

---

## 🙏 致谢

- Next.js
- Caddy
- HLS.js
- Radix UI
- Tailwind CSS
