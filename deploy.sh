#!/bin/bash

set -e

echo ""
echo "  __  __                    ____      _        _______     __"
echo " |  \/  | ___   ___  _ __  / ___|__ _| | _____|_   _\ \   / /"
echo " | |\/| |/ _ \ / _ \| '_ \| |   / _\` | |/ / _ \ | |  \ \ / / "
echo " | |  | | (_) | (_) | | | | |__| (_| |   <  __/ | |   \ V /  "
echo " |_|  |_|\___/ \___/|_| |_|\____\__,_|_|\_\___| |_|    \_/   "
echo ""
echo "                    月饼TV 部署脚本"
echo ""

# Install Docker using official script
install_docker() {
    echo "正在使用官方脚本安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
    echo "Docker 安装完成"
}

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "未检测到 Docker"
    read -p "是否安装 Docker？(Y/n): " install_docker_choice < /dev/tty
    if [ "$install_docker_choice" != "n" ] && [ "$install_docker_choice" != "N" ]; then
        install_docker
    else
        echo "错误: 需要 Docker 才能继续"
        exit 1
    fi
fi

echo "Docker 已就绪: $(docker --version)"
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "检测到已有 .env 文件"
    read -p "是否重新配置？(y/N): " reconfigure < /dev/tty
    if [ "$reconfigure" != "y" ] && [ "$reconfigure" != "Y" ]; then
        echo "使用现有配置启动..."
        docker compose up -d
        echo ""
        echo "部署完成！"
        exit 0
    fi
fi

echo ""

# JWT_SECRET
echo "请输入 JWT_SECRET (用于加密认证令牌)"
echo "留空将自动生成随机密钥"
read -p "JWT_SECRET: " jwt_secret < /dev/tty

if [ -z "$jwt_secret" ]; then
    jwt_secret=$(openssl rand -hex 32)
    echo "已自动生成 JWT_SECRET"
fi

echo ""

# Domain
echo "请输入域名 (例如: mooncake.example.com)"
read -p "域名: " domain < /dev/tty

if [ -z "$domain" ]; then
    echo "错误: 域名不能为空"
    exit 1
fi

echo ""

# Write .env
cat > .env << EOF
JWT_SECRET=$jwt_secret
DOMAIN=$domain
EOF

echo ".env 文件已创建"

# Download Caddyfile and compose.yml from GitHub
REPO_URL="https://raw.githubusercontent.com/MoonCakeTV/MoonCakeTV/main"

echo "正在下载Caddyfile..."
curl -fsSL "$REPO_URL/Caddyfile" -o Caddyfile
echo "Caddyfile 已下载"


echo "正在下载compose.yml..."
curl -fsSL "$REPO_URL/compose.yml" -o compose.yml
echo "compose.yml 已下载"

# Create data directory
mkdir -p data
echo "data 目录已创建"
echo ""

# Start
echo "正在启动服务..."
docker compose pull
docker compose up -d

echo ""
echo "=========================================="
echo "       部署完成！"
echo "=========================================="
echo "访问地址: https://$domain"
echo ""
echo "第一个注册的用户将成为管理员"
echo ""
echo "=========================================="
echo "  推荐: Admiral - 服务器监控平台"
echo "  实时监控、自动部署、内置 SSH 终端"
echo "  https://github.com/node-pulse/admiral"
echo "  如果觉得有用，请给个 Star ⭐"
echo "=========================================="
