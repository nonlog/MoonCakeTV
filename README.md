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

## ✨ 特性

**极简架构**：
- ✅ 单用户模式
- ✅ 可选密码保护
- ✅ 文件存储（无需数据库）
- ✅ 无需 Docker
- ✅ VPS 一键部署

**核心功能**：
- 🔍 多源聚合搜索
- ▶️ 在线播放（HLS.js）
- 💾 收藏功能
- 📝 观看历史
- 📱 响应式设计
- 🌙 深色模式

---

## 🚀 快速开始

### 1. 克隆代码

```bash
git clone https://github.com/your-repo/mooncaketv-web.git
cd mooncaketv-web
```

### 2. 安装依赖

```bash
npm install
```

**系统要求**：Node.js >= 22.0.0

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`：

```bash
# JWT密钥（必需）
JWT_SECRET=your_random_secret_here
```

生成随机密钥：

```bash
openssl rand -hex 32
```

### 4. 启动应用

```bash
npm run dev
```

访问 `http://localhost:3333`

### 5. 设置密码（可选）

首次访问 `/login` 页面，可以设置密码。

**不设置密码** = 任何人都可以访问（公开模式）
**设置密码** = 需要登录才能访问

---

## 📁 数据存储

所有数据存储在一个 JSON 文件中：

```
data/user-data.json
```

包含：
- 密码哈希
- 收藏列表
- 观看历史

**备份**：只需复制这个文件
**迁移**：复制到新服务器即可

---

## 🔧 生产部署（VPS）

### 方法 1：PM2（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 构建
npm run build

# 启动
pm2 start npm --name "mooncaketv" -- start

# 开机自启
pm2 startup
pm2 save
```

### 方法 2：systemd

创建 `/etc/systemd/system/mooncaketv.service`：

```ini
[Unit]
Description=MoonCakeTV
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/mooncaketv-web
Environment="NODE_ENV=production"
Environment="JWT_SECRET=your_secret_here"
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable mooncaketv
sudo systemctl start mooncaketv
```

### 方法 3：Nginx 反向代理

`/etc/nginx/sites-available/mooncaketv`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📁 目录结构

```
mooncaketv-web/
├── data/
│   └── user-data.json          # 数据文件（自动创建）
├── src/
│   ├── app/                    # Next.js页面
│   ├── components/             # React组件
│   ├── lib/
│   │   ├── file-storage.ts     # 文件存储
│   │   └── simple-auth.ts      # 简单认证
│   └── api/
│       ├── login/              # 登录
│       ├── logout/             # 登出
│       ├── bookmarks/          # 收藏
│       └── history/            # 历史
├── .env                        # 配置文件
└── package.json
```

---

## 🔒 安全建议

1. **设置强密码**（如果需要保护）
2. **使用 HTTPS**（通过 Nginx + Let's Encrypt）
3. **定期备份** `data/user-data.json`
4. **设置防火墙**（仅开放 80/443 端口）

---

## 🆘 常见问题

### 忘记密码怎么办？

删除 `data/user-data.json` 文件，重新设置密码。

**注意**：会丢失收藏和历史记录！

### 如何导出数据？

```bash
cp data/user-data.json backup.json
```

### 如何迁移到新服务器？

```bash
# 旧服务器
cp data/user-data.json ~/

# 新服务器
cp ~/user-data.json /path/to/mooncaketv-web/data/
```

### 如何清空观看历史？

```bash
# 方法1：通过API
curl -X DELETE http://localhost:3333/api/history

# 方法2：手动编辑
# 编辑 data/user-data.json，清空 watch_history 数组
```

---

## 🎯 特性对比

| 特性 | 之前 | 现在 |
|------|------|------|
| **数据库** | PostgreSQL + Docker | 单个 JSON 文件 |
| **缓存** | Redis + Docker | 无需缓存 |
| **用户** | 多用户 + 注册 | 单用户 |
| **认证** | 3 种模式 | 可选密码 |
| **部署** | Docker Compose 必需 | `npm start` |
| **依赖** | 93 个包 | 89 个包 |
| **配置** | 15+ 环境变量 | 1 个环境变量 |
| **备份** | 数据库导出 | 复制 1 个文件 |
| **设置时间** | 30+ 分钟 | 2 分钟 |

---

## 📝 API 文档

### 登录
```bash
POST /api/login
Content-Type: application/json

{
  "password": "your_password"
}
```

### 添加收藏
```bash
POST /api/bookmarks
Content-Type: application/json

{
  "id": "video_123",
  "title": "电影名称",
  "thumbnail": "https://...",
  "url": "https://..."
}
```

### 获取收藏
```bash
GET /api/bookmarks
```

### 删除收藏
```bash
DELETE /api/bookmarks?id=video_123
```

### 添加观看历史
```bash
POST /api/history
Content-Type: application/json

{
  "id": "video_123",
  "title": "电影名称",
  "progress": 120
}
```

### 获取观看历史
```bash
GET /api/history
```

### 清空观看历史
```bash
DELETE /api/history
```

---

## 💡 开发

```bash
# 开发模式
npm run dev

# 代码检查
npm run lint

# 类型检查
npm run typecheck

# 构建
npm run build

# 生产运行
npm start
```

---

## 📄 License

MIT

---

## 🙏 致谢

- Next.js
- HLS.js
- Video.js
- Radix UI
- Tailwind CSS
