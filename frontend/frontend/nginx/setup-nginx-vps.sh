#!/bin/bash

# Script để setup Nginx trên VPS thủ công
# Chạy script này trên VPS (không phải trong container)
# Usage: sudo ./setup-nginx-vps.sh [domain] [email]

set -e

DOMAIN="${1:-itworks.dpdns.org}"
EMAIL="${2:-admin@${DOMAIN}}"
FRONTEND_PORT="8080"
NGINX_SITE="itworks-frontend"

echo "🌐 Setting up Nginx trên VPS cho ${DOMAIN}"

# Kiểm tra quyền root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Vui lòng chạy script với sudo"
    exit 1
fi

# 1. Cài đặt Nginx
echo "📦 Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt-get update -qq
    apt-get install -y -qq nginx
else
    echo "✅ Nginx đã được cài đặt"
fi

# 2. Kiểm tra domain đã trỏ về IP chưa
echo "🔍 Kiểm tra DNS..."
if ! command -v dig &> /dev/null; then
    apt-get install -y -qq dnsutils
fi

DOMAIN_IP=$(dig +short ${DOMAIN} | tail -n1)
VPS_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip)

if [ -z "$DOMAIN_IP" ]; then
    echo "❌ Không thể resolve domain ${DOMAIN}"
    echo "⚠️  Vui lòng đảm bảo domain đã trỏ về IP: ${VPS_IP}"
    exit 1
fi

echo "✅ Domain IP: ${DOMAIN_IP}"
echo "✅ VPS IP: ${VPS_IP}"

if [ "$DOMAIN_IP" != "$VPS_IP" ]; then
    echo "⚠️  Domain IP không khớp với VPS IP"
    echo "⚠️  Domain nên trỏ về: ${VPS_IP}"
    read -p "Tiếp tục? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 3. Tạo cấu hình Nginx
echo "📝 Creating Nginx configuration..."
NGINX_CONF="/etc/nginx/sites-available/${NGINX_SITE}"

cat > ${NGINX_CONF} <<EOF
# Upstream đến Frontend container
upstream frontend {
    server 127.0.0.1:${FRONTEND_PORT};
}

# HTTP server - redirect to HTTPS
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all HTTP to HTTPS (sẽ enable sau khi có SSL)
    # return 301 https://\$host\$request_uri;
    
    # Tạm thời proxy HTTP (comment sau khi có SSL)
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://frontend/health;
        proxy_set_header Host \$host;
    }
}

# HTTPS server (sẽ được enable bởi Certbot)
# server {
#     listen 443 ssl http2;
#     server_name ${DOMAIN} www.${DOMAIN};
#     
#     # SSL certificates
#     ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
#     
#     # SSL configuration
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers HIGH:!aNULL:!MD5;
#     ssl_prefer_server_ciphers on;
#     ssl_session_cache shared:SSL:10m;
#     ssl_session_timeout 10m;
#     
#     # Security headers
#     add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
#     add_header X-Frame-Options "SAMEORIGIN" always;
#     add_header X-Content-Type-Options "nosniff" always;
#     add_header X-XSS-Protection "1; mode=block" always;
#     
#     # Gzip compression
#     gzip on;
#     gzip_vary on;
#     gzip_min_length 1024;
#     gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
#     
#     # Proxy settings
#     proxy_set_header Host \$host;
#     proxy_set_header X-Real-IP \$remote_addr;
#     proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
#     proxy_set_header X-Forwarded-Proto \$scheme;
#     proxy_set_header X-Forwarded-Host \$host;
#     proxy_set_header X-Forwarded-Port \$server_port;
#     
#     # Timeouts
#     proxy_connect_timeout 60s;
#     proxy_send_timeout 60s;
#     proxy_read_timeout 60s;
#     
#     # Health check endpoint
#     location /health {
#         access_log off;
#         proxy_pass http://frontend/health;
#         proxy_set_header Host \$host;
#     }
#     
#     # Frontend application
#     location / {
#         proxy_pass http://frontend;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade \$http_upgrade;
#         proxy_set_header Connection "upgrade";
#         
#         # Cache static assets
#         location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
#             proxy_pass http://frontend;
#             expires 1y;
#             add_header Cache-Control "public, immutable";
#         }
#     }
# }
EOF

echo "✅ Nginx configuration created: ${NGINX_CONF}"

# 4. Enable site
echo "🔗 Enabling Nginx site..."
# Xóa default site nếu có
rm -f /etc/nginx/sites-enabled/default

# Tạo symbolic link
ln -sf /etc/nginx/sites-available/${NGINX_SITE} /etc/nginx/sites-enabled/

# Test cấu hình
echo "🧪 Testing Nginx configuration..."
if nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors"
    exit 1
fi

# Reload Nginx
echo "🔄 Reloading Nginx..."
systemctl reload nginx

# 5. Cài đặt SSL Certificate với Let's Encrypt
echo ""
read -p "Bạn có muốn cài đặt SSL certificate ngay bây giờ? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔒 Setting up SSL certificate..."
    
    # Cài đặt Certbot
    if ! command -v certbot &> /dev/null; then
        apt-get install -y -qq certbot python3-certbot-nginx
    fi
    
    # Tạo thư mục cho certbot
    mkdir -p /var/www/certbot
    
    # Lấy SSL certificate
    certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} \
        --non-interactive \
        --agree-tos \
        --email ${EMAIL} \
        --redirect
    
    echo "✅ SSL certificate installed"
    echo "🔄 Reloading Nginx..."
    systemctl reload nginx
else
    echo "ℹ️  Bạn có thể cài đặt SSL sau bằng lệnh:"
    echo "   sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
fi

# 6. Cấu hình Firewall
echo "🔥 Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo "✅ Firewall rules added"
else
    echo "⚠️  UFW không được cài đặt, vui lòng cấu hình firewall thủ công"
fi

# 7. Kiểm tra Frontend container
echo "🔍 Checking Frontend container..."
if docker ps | grep -q itworks-frontend; then
    echo "✅ Frontend container is running"
    CONTAINER_PORT=$(docker port itworks-frontend | grep "80/tcp" | cut -d: -f2)
    if [ "$CONTAINER_PORT" != "$FRONTEND_PORT" ]; then
        echo "⚠️  Frontend container đang chạy trên port ${CONTAINER_PORT}, không phải ${FRONTEND_PORT}"
        echo "⚠️  Vui lòng cập nhật upstream trong Nginx config"
    fi
else
    echo "⚠️  Frontend container chưa chạy"
    echo "⚠️  Vui lòng chạy Jenkins pipeline để deploy Frontend container"
fi

# 8. Test connection
echo "🧪 Testing connection..."
sleep 2
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ HTTP connection successful"
else
    echo "⚠️  HTTP connection test failed"
    echo "⚠️  Kiểm tra Frontend container có đang chạy không"
fi

echo ""
echo "✅✅✅ Setup Nginx hoàn tất! ✅✅✅"
echo ""
echo "📋 Thông tin:"
echo "   - Domain: ${DOMAIN}"
echo "   - Frontend container: localhost:${FRONTEND_PORT}"
echo "   - Nginx config: ${NGINX_CONF}"
echo ""
echo "🌐 Truy cập:"
echo "   - HTTP:  http://${DOMAIN}"
if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    echo "   - HTTPS: https://${DOMAIN}"
fi
echo ""
echo "📝 Lệnh hữu ích:"
echo "   - Test Nginx config: sudo nginx -t"
echo "   - Reload Nginx: sudo systemctl reload nginx"
echo "   - View logs: sudo tail -f /var/log/nginx/error.log"
echo "   - Setup SSL: sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"

