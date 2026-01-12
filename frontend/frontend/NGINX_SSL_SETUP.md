# Hướng dẫn Setup Nginx Reverse Proxy với SSL cho Frontend

## Tổng quan

Thay vì truy cập frontend qua port 5173, chúng ta sẽ:
1. Dùng Nginx làm reverse proxy
2. Ánh xạ port 80/443 → port 5173 (container)
3. Cài SSL certificate (Let's Encrypt) để có HTTPS

## Kiến trúc

```
Internet (HTTPS) → Nginx (443) → Docker Container (5173) → Frontend App
Internet (HTTP)  → Nginx (80)  → Redirect to HTTPS
```

## Cách 1: Setup tự động (Recommended)

### Bước 1: Chạy script setup

```bash
# Trên VPS (không phải trong container)
cd /path/to/ITWorks-Website/frontend/frontend
chmod +x nginx-ssl-setup.sh
sudo ./nginx-ssl-setup.sh your-domain.com admin@your-domain.com
```

### Bước 2: Kiểm tra

- Truy cập: `https://your-domain.com`
- Kiểm tra SSL: `https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com`

## Cách 2: Setup thủ công

### Bước 1: Cài đặt Nginx và Certbot

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Bước 2: Tạo file cấu hình Nginx

```bash
sudo nano /etc/nginx/sites-available/itworks-frontend
```

Copy nội dung từ `nginx.conf` và thay:
- `your-domain.com` → domain của bạn
- Đường dẫn SSL certificates

### Bước 3: Enable site

```bash
sudo ln -s /etc/nginx/sites-available/itworks-frontend /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Xóa default site
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### Bước 4: Cài đặt SSL certificate

```bash
# Đảm bảo domain đã trỏ về IP VPS
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot sẽ tự động:
- Tạo SSL certificate
- Cập nhật cấu hình Nginx
- Setup auto-renewal

### Bước 5: Kiểm tra auto-renewal

```bash
sudo certbot renew --dry-run
```

## Cấu hình trong Jenkinsfile

Cập nhật Jenkinsfile để đảm bảo container chạy đúng port:

```groovy
stage('Deploy') {
    steps {
        script {
            sh """
                docker run -d \\
                    --name ${CONTAINER_NAME} \\
                    --restart unless-stopped \\
                    -p 127.0.0.1:5173:80 \\
                    ${IMAGE_NAME}:${BUILD_NUMBER}
            """
        }
    }
}
```

**Lưu ý**: Bind port 5173 chỉ trên localhost (`127.0.0.1`) để chỉ Nginx có thể truy cập.

## Cấu hình Firewall

```bash
# Cho phép HTTP và HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Không cần mở port 5173 vì chỉ dùng localhost
```

## Kiểm tra và Troubleshooting

### Kiểm tra Nginx status
```bash
sudo systemctl status nginx
```

### Xem logs
```bash
# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Container logs
docker logs -f itworks-frontend
```

### Test Nginx configuration
```bash
sudo nginx -t
```

### Reload Nginx sau khi sửa config
```bash
sudo systemctl reload nginx
```

### Kiểm tra SSL certificate
```bash
sudo certbot certificates
```

### Renew SSL certificate manually
```bash
sudo certbot renew
```

## Cấu hình nâng cao

### 1. Rate limiting

Thêm vào `server` block trong nginx.conf:

```nginx
limit_req_zone $binary_remote_addr zone=frontend_limit:10m rate=10r/s;

server {
    ...
    location / {
        limit_req zone=frontend_limit burst=20 nodelay;
        proxy_pass http://frontend;
    }
}
```

### 2. Caching static assets

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    proxy_pass http://frontend;
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}
```

### 3. Compression

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript 
           application/javascript application/xml+rss application/json;
```

### 4. Security headers

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

## Multiple domains (subdomains)

Nếu cần setup nhiều domain:

```bash
# Frontend
sudo certbot --nginx -d app.your-domain.com

# Backend API (nếu cần)
sudo certbot --nginx -d api.your-domain.com
```

## Backup và Restore

### Backup SSL certificates
```bash
sudo tar -czf ssl-backup-$(date +%Y%m%d).tar.gz /etc/letsencrypt/
```

### Backup Nginx config
```bash
sudo cp -r /etc/nginx/sites-available /backup/nginx-sites-available
sudo cp -r /etc/nginx/sites-enabled /backup/nginx-sites-enabled
```

## Monitoring

### Kiểm tra SSL expiration
```bash
sudo certbot certificates
```

### Setup monitoring cho SSL (optional)
Có thể dùng tools như:
- UptimeRobot
- Pingdom
- Custom script check SSL expiration

## Troubleshooting

### Lỗi: "Connection refused"
- Kiểm tra container có chạy không: `docker ps | grep itworks-frontend`
- Kiểm tra port binding: `netstat -tlnp | grep 5173`

### Lỗi: "SSL certificate not found"
- Kiểm tra certificate: `sudo certbot certificates`
- Renew certificate: `sudo certbot renew`

### Lỗi: "502 Bad Gateway"
- Kiểm tra container logs: `docker logs itworks-frontend`
- Kiểm tra Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- Kiểm tra upstream trong nginx config

### Lỗi: "Too many redirects"
- Kiểm tra cấu hình redirect HTTP → HTTPS
- Đảm bảo không có redirect loop

## Best Practices

1. **Auto-renewal**: Luôn enable auto-renewal cho SSL
2. **Backup**: Backup SSL certificates và Nginx config định kỳ
3. **Monitoring**: Monitor SSL expiration và Nginx status
4. **Security**: Luôn dùng HTTPS, redirect HTTP → HTTPS
5. **Performance**: Enable gzip và caching cho static assets
6. **Logs**: Rotate logs định kỳ để tránh đầy disk

## Kết quả

Sau khi setup xong:
- ✅ Frontend truy cập qua: `https://your-domain.com`
- ✅ HTTP tự động redirect sang HTTPS
- ✅ SSL certificate tự động renew
- ✅ Security headers được cấu hình
- ✅ Static assets được cache

