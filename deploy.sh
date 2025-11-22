#!/bin/bash

# MoonCakeTV Web 部署脚本
# 用户只需下载此脚本并运行，脚本会自动完成所有部署工作

set -e  # 遇到错误立即退出

# 安装目录
INSTALL_DIR="/opt/mooncaketv"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查 root 权限
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "需要 root 权限才能安装到 /opt 目录"
        print_info "请使用 sudo 运行此脚本："
        print_info "  sudo bash deploy.sh"
        exit 1
    fi
}

# 检查 Node.js 版本
check_node_version() {
    if ! command_exists node; then
        print_error "Node.js 未安装"
        return 1
    fi

    local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 22 ]; then
        print_error "Node.js 版本必须 >= 22.0.0，当前版本：$(node -v)"
        return 1
    fi

    print_success "Node.js 版本检查通过：$(node -v)"
    return 0
}

# 创建目录结构
create_directory_structure() {
    print_info "创建目录结构..."

    # 创建 /opt/mooncaketv
    if [ ! -d "$INSTALL_DIR" ]; then
        mkdir -p "$INSTALL_DIR"
        print_success "已创建：${INSTALL_DIR}"
    else
        print_success "目录已存在：${INSTALL_DIR}"
    fi

    # 创建 data 目录
    if [ ! -d "$INSTALL_DIR/data" ]; then
        mkdir -p "$INSTALL_DIR/data"
        chmod 700 "$INSTALL_DIR/data"
        print_success "已创建：${INSTALL_DIR}/data"
    else
        print_success "目录已存在：${INSTALL_DIR}/data"
    fi
}

# 检查并创建 .env 文件
setup_env_file() {
    local env_file="$INSTALL_DIR/.env"

    if [ -f "$env_file" ]; then
        print_success ".env 文件已存在"
        return 0
    fi

    print_info "创建 .env 配置文件..."

    # 生成 JWT_SECRET
    local jwt_secret=""
    if command_exists openssl; then
        jwt_secret=$(openssl rand -hex 32)
    else
        print_warning "openssl 未安装，使用随机字符串"
        jwt_secret=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
    fi

    # 创建 .env 文件
    cat > "$env_file" <<EOF
# MoonCakeTV 配置文件
# 自动生成于 $(date)

# JWT 密钥（用于身份验证）
JWT_SECRET=${jwt_secret}

# 应用端口
PORT=3333

# 生产环境
NODE_ENV=production
EOF

    chmod 600 "$env_file"
    print_success ".env 文件创建成功"
}

# Git 克隆源代码
clone_source_code() {
    print_info "========== 克隆源代码 =========="

    # 检查 git
    if ! command_exists git; then
        print_error "Git 未安装"
        print_info "安装命令："
        print_info "  Ubuntu/Debian: sudo apt install git"
        print_info "  CentOS/RHEL: sudo yum install git"
        return 1
    fi

    # 询问仓库地址
    read -p "请输入 Git 仓库地址: " REPO_URL
    if [ -z "$REPO_URL" ]; then
        print_error "仓库地址不能为空"
        return 1
    fi

    # 检查是否已有代码
    if [ -d "$INSTALL_DIR/package.json" ] || [ -d "$INSTALL_DIR/src" ]; then
        print_warning "目录中已存在项目文件"
        read -p "是否删除并重新克隆？(y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "清理旧文件..."
            cd "$INSTALL_DIR"
            # 保留 data 目录和 .env
            find . -mindepth 1 -maxdepth 1 ! -name 'data' ! -name '.env' -exec rm -rf {} +
        else
            print_info "保留现有文件"
            return 0
        fi
    fi

    # 克隆到临时目录
    local temp_dir=$(mktemp -d)
    print_info "正在克隆仓库..."

    if git clone "$REPO_URL" "$temp_dir"; then
        # 移动文件到目标目录（保留 data 和 .env）
        print_info "复制文件到 ${INSTALL_DIR}..."
        cp -r "$temp_dir"/* "$INSTALL_DIR/"
        cp -r "$temp_dir"/.[!.]* "$INSTALL_DIR/" 2>/dev/null || true
        rm -rf "$temp_dir"
        print_success "源代码克隆成功"
    else
        print_error "克隆失败"
        rm -rf "$temp_dir"
        return 1
    fi
}

# Docker Compose 部署
deploy_with_docker_compose() {
    print_info "========== Docker Compose 部署 =========="

    # 检查 Docker
    if ! command_exists docker; then
        print_error "Docker 未安装"
        print_info "安装指南：https://docs.docker.com/engine/install/"
        return 1
    fi

    # 检查 Docker Compose
    if ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose 未安装"
        print_info "Docker Compose 通常随 Docker 一起安装"
        return 1
    fi

    print_success "Docker 已就绪：$(docker --version)"

    # 创建 docker-compose.yml
    local compose_file="$INSTALL_DIR/docker-compose.yml"

    if [ ! -f "$compose_file" ]; then
        print_info "创建 docker-compose.yml..."
        cat > "$compose_file" <<'EOF'
version: '3.8'

services:
  mooncaketv:
    image: mooncaketv-web:latest
    build: .
    container_name: mooncaketv
    ports:
      - "3333:3333"
    volumes:
      - ./data:/app/data
    env_file:
      - .env
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
EOF
        print_success "docker-compose.yml 创建成功"
    fi

    # 进入目录并构建
    cd "$INSTALL_DIR"

    print_info "构建 Docker 镜像..."
    docker compose build

    print_info "启动服务..."
    docker compose up -d

    print_success "Docker Compose 部署成功！"
    print_info ""
    print_info "常用命令："
    print_info "  查看日志：cd ${INSTALL_DIR} && docker compose logs -f"
    print_info "  停止服务：cd ${INSTALL_DIR} && docker compose down"
    print_info "  重启服务：cd ${INSTALL_DIR} && docker compose restart"
    print_info "  查看状态：cd ${INSTALL_DIR} && docker compose ps"
}

# PM2 部署
deploy_with_pm2() {
    print_info "========== PM2 部署 =========="

    # 检查 Node.js
    if ! check_node_version; then
        print_error "Node.js 版本不符合要求"
        print_info "建议使用 nvm 安装 Node.js 22+"
        print_info "安装 nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
        print_info "安装 Node.js: nvm install 22 && nvm use 22"
        return 1
    fi

    # 检查 PM2
    if ! command_exists pm2; then
        print_warning "PM2 未安装"
        read -p "是否安装 PM2？(y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "正在安装 PM2..."
            npm install -g pm2
            print_success "PM2 安装成功"
        else
            print_error "需要 PM2 才能继续部署"
            return 1
        fi
    else
        print_success "PM2 已安装：$(pm2 --version)"
    fi

    # 进入项目目录
    cd "$INSTALL_DIR"

    # 安装依赖
    print_info "正在安装依赖..."
    npm install
    print_success "依赖安装成功"

    # 构建项目
    print_info "正在构建项目..."
    npm run build
    print_success "项目构建成功"

    # 检查 PM2 进程是否已存在
    if pm2 list | grep -q "mooncaketv"; then
        print_warning "PM2 进程 mooncaketv 已存在"
        read -p "是否重启应用？(y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "重启应用..."
            pm2 restart mooncaketv
            print_success "应用重启成功"
        else
            print_info "跳过启动"
            return 0
        fi
    else
        # 启动应用
        print_info "正在启动应用..."
        pm2 start npm --name "mooncaketv" -- start
        print_success "应用启动成功"

        # 询问是否设置开机自启
        read -p "是否设置 PM2 开机自启？(y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "设置开机自启..."
            pm2 startup
            pm2 save
            print_success "开机自启设置成功"
        fi
    fi

    print_success "PM2 部署完成！"
    print_info ""
    print_info "常用命令："
    print_info "  查看状态：pm2 status"
    print_info "  查看日志：pm2 logs mooncaketv"
    print_info "  监控资源：pm2 monit"
    print_info "  重启应用：pm2 restart mooncaketv"
    print_info "  停止应用：pm2 stop mooncaketv"
}

# 配置 Nginx
setup_nginx() {
    if ! command_exists nginx; then
        print_warning "Nginx 未安装"
        print_info "安装命令："
        print_info "  Ubuntu/Debian: sudo apt install nginx"
        print_info "  CentOS/RHEL: sudo yum install nginx"
        print_info "  macOS: brew install nginx"
        return 1
    fi

    read -p "请输入域名（例如：mooncaketv.example.com）: " DOMAIN
    if [ -z "$DOMAIN" ]; then
        print_error "域名不能为空"
        return 1
    fi

    local nginx_config="/etc/nginx/sites-available/mooncaketv"

    cat > ${nginx_config} <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # 视频流超时设置
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # 静态文件缓存
    location /_next/static {
        proxy_pass http://localhost:3333;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    # 启用站点
    if [ -d "/etc/nginx/sites-enabled" ]; then
        ln -sf "$nginx_config" /etc/nginx/sites-enabled/mooncaketv
    fi

    # 测试配置
    if nginx -t; then
        systemctl reload nginx
        print_success "Nginx 配置成功"
        print_info ""
        print_info "配置 HTTPS (Let's Encrypt)："
        print_info "  sudo apt install certbot python3-certbot-nginx"
        print_info "  sudo certbot --nginx -d ${DOMAIN}"
    else
        print_error "Nginx 配置测试失败"
        return 1
    fi
}

# 配置 Caddy
setup_caddy() {
    if ! command_exists caddy; then
        print_warning "Caddy 未安装"
        print_info "安装指南: https://caddyserver.com/docs/install"
        return 1
    fi

    read -p "请输入域名（例如：mooncaketv.example.com）: " DOMAIN
    if [ -z "$DOMAIN" ]; then
        print_error "域名不能为空"
        return 1
    fi

    local caddy_config="/etc/caddy/Caddyfile"

    cat > ${caddy_config} <<EOF
${DOMAIN} {
    reverse_proxy localhost:3333
}
EOF

    systemctl reload caddy
    print_success "Caddy 配置成功"
    print_info "注意：Caddy 会自动配置 HTTPS 证书"
}

# 配置反向代理
setup_reverse_proxy() {
    print_info "========== 配置反向代理 =========="

    echo "请选择反向代理类型："
    echo "1) Nginx"
    echo "2) Caddy"
    echo "3) 跳过"
    read -p "请选择 [1-3]: " -n 1 -r
    echo

    case $REPLY in
        1)
            setup_nginx
            ;;
        2)
            setup_caddy
            ;;
        3)
            print_info "跳过反向代理配置"
            ;;
        *)
            print_warning "无效选择，跳过反向代理配置"
            ;;
    esac
}

# 主菜单
main_menu() {
    clear
    echo "================================================"
    echo "     MoonCakeTV Web 一键部署脚本"
    echo "================================================"
    echo ""
    echo "安装目录：${INSTALL_DIR}"
    echo ""
    echo "请选择部署方式："
    echo ""
    echo "1) Docker Compose 部署（推荐）"
    echo "2) PM2 部署（VPS 原生性能）"
    echo "3) 仅配置反向代理（Nginx/Caddy）"
    echo "4) 退出"
    echo ""
    read -p "请选择 [1-4]: " -n 1 -r
    echo
    echo ""

    case $REPLY in
        1)
            create_directory_structure
            setup_env_file
            clone_source_code
            deploy_with_docker_compose
            echo ""
            read -p "是否配置反向代理？(y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                setup_reverse_proxy
            fi
            ;;
        2)
            create_directory_structure
            setup_env_file
            clone_source_code
            deploy_with_pm2
            echo ""
            read -p "是否配置反向代理？(y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                setup_reverse_proxy
            fi
            ;;
        3)
            setup_reverse_proxy
            ;;
        4)
            print_info "退出部署脚本"
            exit 0
            ;;
        *)
            print_error "无效选择"
            exit 1
            ;;
    esac

    echo ""
    print_success "========== 部署完成 =========="
    echo ""
    print_info "安装目录：${INSTALL_DIR}"
    print_info "数据目录：${INSTALL_DIR}/data"
    print_info "访问地址：http://your-server-ip:3333"
    echo ""
    print_info "后续步骤："
    print_info "1. 确保防火墙开放 80 和 443 端口"
    print_info "2. 如果使用域名，请确保 DNS 记录已正确配置"
    print_info "3. 首次访问 /login 页面设置密码"
    print_info "4. 定期备份 ${INSTALL_DIR}/data/user-data.json"
    echo ""
}

# 脚本入口
check_root
main_menu
