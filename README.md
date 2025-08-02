# MoonCakeTV 月饼TV

<div align="center">
  <img src="public/logo.png" alt="MoonCakeTV Logo" width="120">
</div>

> 🎬 **MoonCakeTV 月饼TV** 是一个影视聚合搜索服务。它基于 **Next.js 15** + **Tailwind&nbsp;CSS** + **TypeScript** 构建，支持多资源搜索和在线播放，让你可以随时随地搜索海量免费影视内容。

> 作者鼓励社区同行fork本项目进行二次开发

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15-000?logo=nextdotjs)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)
![Docker Ready](https://img.shields.io/badge/Docker-ready-blue?logo=docker)

</div>

---

## ✨ 功能特性

- 🔍 **多源聚合搜索**：汇聚数十个免费资源站点，一次搜索立刻返回全源结果
- 📄 **丰富详情页**：支持剧集列表、演员、年份、简介等完整信息展示
- ▶️ **在线播放**：集成 HLS.js & ArtPlayer 播放器
- 📱 **响应式布局**：自适应各种屏幕尺寸
- 🚀 **多平台部署**：支持 Docker、Vercel、Cloudflare Workers 部署

## 社区

- Telegram: https://t.me/mooncaketv

## 界面截图

<img src="public/screenshot.png" alt="项目截图" style="max-width:600px">

## 🗺 目录

- [技术栈](#技术栈)
- [部署](#部署)
- [Docker 部署](#docker-部署)
- [安全与隐私提醒](#安全与隐私提醒)
- [License](#license)
- [致谢](#致谢)

## 技术栈

| 分类      | 主要依赖                                                                                              |
| --------- | ----------------------------------------------------------------------------------------------------- |
| 前端框架  | [Next.js 15](https://nextjs.org/) · App Router                                                        |
| UI & 样式 | [Tailwind&nbsp;CSS 4](https://tailwindcss.com/)                                                       |
| 语言      | TypeScript 5                                                                                          |
| 播放器    | [ArtPlayer](https://github.com/zhw2590582/ArtPlayer) · [HLS.js](https://github.com/video-dev/hls.js/) |
| 代码质量  | ESLint · Prettier · Jest                                                                              |
| 部署      | Docker · Vercel · Cloudflare Workers                                                                  |

## 部署

本项目支持多种部署方式：**Docker**、**Vercel**、**Cloudflare Workers**。

### Vercel 部署

> 推荐使用，零运维成本，免费额度足够个人使用。

1. **Fork** 本仓库到你的 GitHub 账户
2. 登陆 [Vercel](https://vercel.com/)，点击 **Add New → Project**，选择 Fork 后的仓库
3. （可选）设置 PASSWORD 环境变量进行密码保护
4. 保持默认设置完成部署

部署完成后即可通过分配的域名访问，也可以绑定自定义域名。

### Cloudflare Workers 部署

1. **Fork** 本仓库到你的 GitHub 账户
2. 登陆 [Cloudflare](https://cloudflare.com)，进入 **Workers 和 Pages**
3. 选择 **Pages**，导入 Git 存储库，选择 Fork 后的仓库
4. 构建设置：
   - 构建命令：`npm install && npm run build`
   - 构建输出目录：`out`
5. （可选）设置 PASSWORD 环境变量进行密码保护
6. 完成部署

> 注意：Cloudflare Workers 部署可能需要根据具体配置进行调整，建议先测试 Docker 或 Vercel 部署。

## Docker 部署

> 适用于自建服务器 / NAS / 群晖等场景。

### 直接运行

```bash
# 构建镜像
docker build -t mooncaketv .

# 运行容器
docker run -d --name mooncaketv -p 3000:3000 mooncaketv
```

### Docker Compose

创建 `docker-compose.yml` 文件：

```yaml
services:
  mooncaketv:
    build: .
    container_name: mooncaketv
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - PASSWORD=your_password # 可选：设置访问密码
```

运行：

```bash
docker-compose up -d
```

访问 `http://服务器IP:3000` 即可使用。

## 安全与隐私提醒

### 强烈建议设置密码保护

为了您的安全和避免潜在的法律风险，我们**强烈建议**在部署时设置密码保护：

- **避免公开访问**：不设置密码的实例任何人都可以访问，可能被恶意利用
- **防范版权风险**：公开的视频搜索服务可能面临版权方的投诉举报
- **保护个人隐私**：设置密码可以限制访问范围，保护您的使用记录

### 部署建议

1. **设置环境变量 `PASSWORD`**：为您的实例设置一个强密码
2. **仅供个人使用**：请勿将您的实例链接公开分享或传播
3. **遵守当地法律**：请确保您的使用行为符合当地法律法规

### 重要声明

- 本项目仅供学习和个人使用
- 请勿将部署的实例用于商业用途或公开服务
- 如因公开分享导致的任何法律问题，用户需自行承担责任
- 项目开发者不对用户的使用行为承担任何法律责任

## License

[MIT](LICENSE) © 2025 MoonCakeTV & Contributors

## 致谢

- 本项目由[MoonTV](https://github.com/senshinya/MoonTV) fork而来，进行了一系列优化
- [ts-nextjs-tailwind-starter](https://github.com/theodorusclarence/ts-nextjs-tailwind-starter) — 项目最初基于该脚手架。
- [LibreTV](https://github.com/LibreSpark/LibreTV) — 由此启发，站在巨人的肩膀上。
- [ArtPlayer](https://github.com/zhw2590582/ArtPlayer) — 提供强大的网页视频播放器。
- [HLS.js](https://github.com/video-dev/hls.js) — 实现 HLS 流媒体在浏览器中的播放支持。
- 感谢所有提供免费影视接口的站点。
