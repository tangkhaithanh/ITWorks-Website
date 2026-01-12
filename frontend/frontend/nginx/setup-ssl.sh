#!/bin/bash

# Script để setup SSL cho domain itworks.dpdns.org
# Chạy trên VPS (không phải trong container)

set -e

DOMAIN="itworks.dpdns.org"
EMAIL="${1:-admin@${DOMAIN}}"
NGINX_CONTAINER="itworks-nginx"

echo "🔒 Setting up SSL cho ${DOMAIN}"

# Kiểm tra quyền root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Vui lòng chạy script với sudo"
    exit 1
fi

# 1. Kiểm tra domain đã trỏ về IP chưa
echo "🔍 Kiểm tra DNS..."
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

# 2. Cài đặt Certbot
echo "📦 Installing Certbot..."
apt update
apt install -y certbot

# 3. Tạo thư mục cho certificates
mkdir -p /etc/letsencrypt/live/${DOMAIN}
mkdir -p /var/www/certbot

# 4. Tạm thời stop nginx container để certbot có thể dùng port 80
echo "🛑 Stopping Nginx container..."
docker stop ${NGINX_CONTAINER} || true

# 5. Lấy SSL certificate
echo "🔐 Getting SSL certificate..."
certbot certonly --standalone \
    -d ${DOMAIN} \
    -d www.${DOMAIN} \
    --non-interactive \
    --agree-tos \
    --email ${EMAIL} \
    --preferred-challenges http

# 6. Uncomment HTTPS server block trong nginx.conf
echo "📝 Updating Nginx configuration..."
cd /var/lib/jenkins/workspace/itworks-frontend/frontend/frontend/nginx || \
cd $(dirname $(readlink -f $0))

# Backup nginx.conf
cp nginx.conf nginx.conf.backup

# Uncomment HTTPS server block
sed -i 's/# server {/server {/g' nginx.conf
sed -i 's/#     listen 443/    listen 443/g' nginx.conf
sed -i 's/#     server_name/    server_name/g' nginx.conf
sed -i 's/#     ssl_certificate/    ssl_certificate/g' nginx.conf
sed -i 's/#     ssl_certificate_key/    ssl_certificate_key/g' nginx.conf
sed -i 's/#     ssl_protocols/    ssl_protocols/g' nginx.conf
sed -i 's/#     ssl_ciphers/    ssl_ciphers/g' nginx.conf
sed -i 's/#     ssl_prefer_server_ciphers/    ssl_prefer_server_ciphers/g' nginx.conf
sed -i 's/#     ssl_session_cache/    ssl_session_cache/g' nginx.conf
sed -i 's/#     ssl_session_timeout/    ssl_session_timeout/g' nginx.conf
sed -i 's/#     add_header/    add_header/g' nginx.conf
sed -i 's/#     gzip/    gzip/g' nginx.conf
sed -i 's/#     proxy_set_header/    proxy_set_header/g' nginx.conf
sed -i 's/#     proxy_connect_timeout/    proxy_connect_timeout/g' nginx.conf
sed -i 's/#     proxy_send_timeout/    proxy_send_timeout/g' nginx.conf
sed -i 's/#     proxy_read_timeout/    proxy_read_timeout/g' nginx.conf
sed -i 's/#     location/    location/g' nginx.conf
sed -i 's/#         proxy_pass/        proxy_pass/g' nginx.conf
sed -i 's/#         proxy_http_version/        proxy_http_version/g' nginx.conf
sed -i 's/#         proxy_set_header/        proxy_set_header/g' nginx.conf
sed -i 's/#         expires/        expires/g' nginx.conf
sed -i 's/#         add_header/        add_header/g' nginx.conf
sed -i 's/# }/}/g' nginx.conf

# Enable HTTP to HTTPS redirect
sed -i 's/# return 301 https/return 301 https/g' nginx.conf

echo "✅ Nginx configuration updated"

# 7. Rebuild Nginx image
echo "🔨 Rebuilding Nginx image..."
docker build -t itworks-nginx:latest .

# 8. Start Nginx container với SSL certificates mounted
echo "🚀 Starting Nginx container with SSL..."
docker run -d \
    --name ${NGINX_CONTAINER} \
    --restart unless-stopped \
    -p 80:80 \
    -p 443:443 \
    -v /etc/letsencrypt:/etc/letsencrypt:ro \
    --network itworks-network \
    itworks-nginx:latest

# 9. Setup auto-renewal
echo "🔄 Setting up auto-renewal..."
cat > /etc/cron.d/certbot-renew <<EOF
0 0 * * * certbot renew --quiet --deploy-hook "docker restart ${NGINX_CONTAINER}"
EOF

echo "✅ Setup hoàn tất!"
echo "🌐 Frontend đã được cấu hình tại: https://${DOMAIN}"
echo "📋 Kiểm tra SSL: https://www.ssllabs.com/ssltest/analyze.html?d=${DOMAIN}"
echo ""
echo "⚠️  Lưu ý: Cần rebuild Nginx image trong Jenkins để áp dụng cấu hình mới"

