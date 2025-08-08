# MoonCakeTV 月饼TV

<div align="center">
  <img src="public/logo.png" alt="MoonCakeTV Logo" width="120">
</div>

> 🎬 **MoonCakeTV 月饼TV** 是一个影视聚合搜索服务。它基于 **Next.js 15** + **Tailwind&nbsp;CSS** + **TypeScript** 构建，支持多资源搜索和在线播放。

> 作者鼓励社区同行fork本项目进行二次开发

<div align="center">

![License](https://img.shields.io/badge/License-MIT-green)
![Docker Ready](https://img.shields.io/badge/Docker-ready-blue?logo=docker)

</div>

---

## ✨ 功能特性

- 🔍 **多源聚合搜索**：汇聚数十个免费资源站点，一次搜索立刻返回全源结果
- 📄 **丰富详情页**：支持剧集列表、演员、年份、简介等完整信息展示
- ▶️ **在线播放**：集成 HLS.js & Video.js 播放器
- 📱 **响应式布局**：自适应各种屏幕尺寸
- 🚀 **多平台部署**：支持 Docker、Vercel 部署

## 🚀 本地开发 Local Development

- 先决条件：Node.js 18+（推荐 20/22），npm
- 安装依赖并启动开发服务器（默认端口 `3333`）：

```bash
npm install
npm run dev
# 访问 http://localhost:3333
```

## 🎃🎃🎃 社区

- Telegram: https://t.me/mooncaketv

## 🐳 Docker 部署 (已测试 ✅)

> 适用于自建服务器 / NAS / 群晖等场景。

### 第一步：密码保护设置㊙️

为安全起见，强烈建议启用密码保护。请在项目根目录新建 `.env` 文件，至少设置：

```bash
# 密码模式：local | env | db（默认 local，无需登录）
PASSWORD_MODE=env
# 当 PASSWORD_MODE=env 时，访问口令：
MY_PASSWORD=your_secure_password

# 可选：HLS 代理白名单与缓存策略（按需）
# HLS_PROXY_ALLOW_HOSTS=example.com,cdn.example.com
# HLS_MANIFEST_TTL_S=30
# HLS_MANIFEST_LIVE_TTL_S=10
# HLS_SEGMENT_TTL_S=600
```

### 拉取已构建好的镜像（推荐🔥）

```shell
# 拉取镜像
docker pull ghcr.io/mooncaketv/mooncaketv:latest
# 运行容器（容器内监听 3000，映射到宿主机 3333）
docker run -d \
  --name mooncaketv \
  --env-file .env \
  -p 3333:3000 \
  ghcr.io/mooncaketv/mooncaketv:latest
```

### 自己构建 docker 镜像（使用 Makefile）

```bash
# 构建镜像
make d-build

# 运行容器
make d-run
```

### 自己构建 docker 镜像（使用 Docker CLI）

```bash
# 构建镜像
docker build -t mooncaketv .

# 运行容器（推荐将宿主机 3333 映射到容器 3000）
# 无密码（不建议）
docker run -d --name mooncaketv -p 3333:3000 mooncaketv
# 密码保护（需要 .env）
docker run -d --name mooncaketv --env-file .env -p 3333:3000 mooncaketv
```

## ▲ Vercel 部署 (已测试 ✅)

> 零运维成本，免费额度足够个人使用

> 请注意⚠️⚠️⚠️：现在所有的流量都从`/api/proxy/hls`走，会使用服务器大量的流量；vercel是否会因此封号，这是值得注意的

1. **Fork** 本仓库到你的 GitHub 账户
2. 登陆 [Vercel](https://vercel.com/)，点击 **Add New → Project**，选择 Fork 后的仓库
3. 在项目 Settings → Environment Variables 中添加：`PASSWORD_MODE=env`、`MY_PASSWORD=your_secure_password`
4. 保持默认设置完成部署

部署完成后即可通过分配的域名访问，也可以绑定自定义域名。

> 注意：目前播放均经由 `/api/proxy/hls`，将占用较多带宽与函数调用；请留意服务商使用条款与流量费用。

## ~~Cloudflare Workers 部署（放弃支持）~~

> ~~近期多起封号事件~~

## 🔒 安全与隐私提醒

### 强烈建议设置密码保护

#### 为了您的安全和避免潜在的法律风险，我们**强烈建议**在部署时设置密码保护：

- **避免公开访问**：不设置密码的实例任何人都可以访问，可能被恶意利用
- **防范版权风险**：公开的视频搜索服务可能面临版权方的投诉举报
- **保护个人隐私**：设置密码可以限制访问范围，保护您的使用记录

### 部署建议

1. **设置环境变量 `PASSWORD_MODE=env` 和 `MY_PASSWORD=my_password`**：为您的实例设置一个强密码
2. **仅供个人使用**：请勿将您的实例链接公开分享或传播
3. **遵守当地法律**：请确保您的使用行为符合当地法律法规

### 重要声明

- 本项目仅供学习和个人使用
- 请勿将部署的实例用于商业用途或公开服务
- 如因公开分享导致的任何法律问题，用户需自行承担责任
- 项目开发者不对用户的使用行为承担任何法律责任

## ⚙️ 环境变量一览

- `PASSWORD_MODE`：`local` | `env` | `db`（默认 `local`）
  - `local`：不开启登录（仅限自用环境）
  - `env`：使用 `MY_PASSWORD` 作为访问口令
  - `db`：预留，暂未启用
- `MY_PASSWORD`：当 `PASSWORD_MODE=env` 时必填
- `HLS_PROXY_ALLOW_HOSTS`：允许的上游域名白名单（逗号分隔）。留空表示不限制。
- `HLS_MANIFEST_TTL_S` / `HLS_MANIFEST_LIVE_TTL_S`：清单文件缓存秒数（点播 / 直播）
- `HLS_SEGMENT_TTL_S`：分片缓存秒数

## 🧪 常见问题 FAQ

- 打不开页面或反复跳转登录？
  - 确认 `PASSWORD_MODE` 与 `MY_PASSWORD` 设置正确；清理浏览器 Cookie 后重试。
- Docker 启动后访问不到？
  - 请确认端口映射为 `-p 3333:3000`，并访问 `http://localhost:3333`。
- Vercel 是否安全？
  - Vercel 免费额度有限且代理流量较大，请谨慎评估使用风险和成本。

## License

[MIT](LICENSE)

## 界面截图

<img src="public/screenshot.png" alt="项目截图" style="max-width:600px">

## 技术栈

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15-000?logo=nextdotjs)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)
![Docker Ready](https://img.shields.io/badge/Docker-ready-blue?logo=docker)

</div>

<table>
  <thead>
    <tr>
      <th>分类</th>
      <th>主要依赖</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>前端</td>
      <td><a href="https://nextjs.org/">Next.js</a> · <a href="https://tailwindcss.com/">Tailwind CSS</a> · TypeScript</td>
    </tr>
    <tr>
      <td>播放器</td>
      <td>
        <a href="https://github.com/videojs/video.js">Video.js</a> · 
        <a href="https://github.com/video-dev/hls.js/">HLS.js</a>
      </td>
    </tr>
    <tr>
      <td>代码质量</td>
      <td>ESLint · Prettier</td>
    </tr>
    <tr>
      <td>服务器</td>
      <td>Cloudflare Workers · Racknerd VPS</td>
    </tr>
    <tr>
      <td>数据库</td>
      <td>Open Search · Cloudflare D1</td>
    </tr>
  </tbody>
</table>

## 致谢

- 本项目由[MoonTV](https://github.com/LunaTechLab/MoonTV) fork而来，进行了一系列优化
- [ts-nextjs-tailwind-starter](https://github.com/theodorusclarence/ts-nextjs-tailwind-starter) — 项目最初基于该脚手架。
- [LibreTV](https://github.com/LibreSpark/LibreTV) — 由此启发，站在巨人的肩膀上。
- [Video.js](https://github.com/videojs/video.js) — 提供强大的网页视频播放器。
- [HLS.js](https://github.com/video-dev/hls.js) — 实现 HLS 流媒体在浏览器中的播放支持。
- 感谢所有提供免费影视接口的站点。
