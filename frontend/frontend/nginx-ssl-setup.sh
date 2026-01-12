#!/bin/bash

# Script để setup Nginx reverse proxy với SSL cho Frontend
# Chạy script này trên VPS (không phải trong container)

set -e

DOMAIN="${1:-your-domain.com}"
EMAIL="${2:-admin@${DOMAIN}}"
CONTAINER_NAME="itworks-frontend"
NGINX_CONF="/etc/nginx/sites-available/itworks-frontend"
NGINX_ENABLED="/etc/nginx/sites-enabled/itworks-frontend"

echo "🔧 Setting up Nginx reverse proxy với SSL cho ${DOMAIN}"

# Kiểm tra quyền root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Vui lòng chạy script với sudo"
    exit 1
fi

# 1. Cài đặt Nginx và Certbot
echo "📦 Installing Nginx and Certbot..."
apt update
apt install -y nginx certbot python3-certbot-nginx

# 2. Tạo thư mục cho Let's Encrypt challenge
mkdir -p /var/www/certbot

# 3. Tạo file cấu hình Nginx tạm thời (chưa có SSL)
echo "📝 Creating temporary Nginx configuration..."
cat > /etc/nginx/sites-available/itworks-frontend <<EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# 4. Enable site
ln -sf /etc/nginx/sites-available/itworks-frontend /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# 5. Test và reload Nginx
nginx -t
systemctl reload nginx

# 6. Cài đặt SSL certificate với Certbot
echo "🔒 Installing SSL certificate..."
certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email ${EMAIL} --redirect

# 7. Setup auto-renewal
echo "🔄 Setting up auto-renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

# 8. Test Nginx configuration
nginx -t
systemctl reload nginx

echo "✅ Setup hoàn tất!"
echo "🌐 Frontend đã được cấu hình tại: https://${DOMAIN}"
echo "📋 Kiểm tra status: systemctl status nginx"
echo "📋 Xem logs: tail -f /var/log/nginx/error.log"

