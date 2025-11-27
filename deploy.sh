#!/bin/bash

set -e

# Check if script is being piped without terminal access
# If so, show instructions for proper execution
if [ ! -t 0 ] && [ ! -t 1 ]; then
    echo "错误: 此脚本需要交互式终端"
    echo ""
    echo "请使用以下命令运行:"
    echo "  bash <(curl -fsSL https://raw.githubusercontent.com/MoonCakeTV/MoonCakeTV/main/deploy.sh)"
    echo ""
    echo "或者下载后运行:"
    echo "  curl -fsSL https://raw.githubusercontent.com/MoonCakeTV/MoonCakeTV/main/deploy.sh -o deploy.sh"
    echo "  bash deploy.sh"
    exit 1
fi

# Ensure we can read from terminal even when piped
if [ ! -t 0 ]; then
    exec < /dev/tty || {
        echo "错误: 无法访问终端"
        echo "请使用: bash <(curl -fsSL URL)"
        exit 1
    }
fi

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
    read -p "是否安装 Docker？(Y/n): " install_docker_choice
    if [ "$install_docker_choice" != "n" ] && [ "$install_docker_choice" != "N" ]; then
        install_docker
    else
        echo "错误: 需要 Docker 才能继续"
        exit 1
    fi
fi

echo "Docker 已就绪: $(docker --version)"
echo ""

# Load existing .env values if file exists
existing_jwt_secret=""
existing_domain=""

if [ -f .env ]; then
    echo "检测到已有 .env 文件，正在读取现有配置..."
    # Source the existing .env to get values
    existing_jwt_secret=$(grep -E "^JWT_SECRET=" .env 2>/dev/null | cut -d'=' -f2- || echo "")
    existing_domain=$(grep -E "^DOMAIN=" .env 2>/dev/null | cut -d'=' -f2- || echo "")
    echo ""
fi

# JWT_SECRET
echo "请输入 JWT_SECRET (用于加密认证令牌)"
if [ -n "$existing_jwt_secret" ]; then
    # Show masked version of existing secret
    masked_secret="${existing_jwt_secret:0:8}...${existing_jwt_secret: -4}"
    echo "当前值: $masked_secret"
    echo "直接回车保留现有值，或输入新值"
fi
echo "留空将自动生成随机密钥"
read -p "JWT_SECRET: " jwt_secret

if [ -z "$jwt_secret" ]; then
    if [ -n "$existing_jwt_secret" ]; then
        jwt_secret="$existing_jwt_secret"
        echo "保留现有 JWT_SECRET"
    else
        jwt_secret=$(openssl rand -hex 32)
        echo "已自动生成 JWT_SECRET"
    fi
fi

echo ""

# Domain
echo "请输入域名，否则无法登录 (例如: mooncake.example.com，最好使用二级域名)"
if [ -n "$existing_domain" ]; then
    echo "当前值: $existing_domain"
    echo "直接回车保留现有值，或输入新值"
fi
read -p "域名: " domain

if [ -z "$domain" ]; then
    if [ -n "$existing_domain" ]; then
        domain="$existing_domain"
        echo "保留现有域名: $domain"
    else
        echo "错误: 域名不能为空"
        exit 1
    fi
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
