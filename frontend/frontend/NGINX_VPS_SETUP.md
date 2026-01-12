# Hướng dẫn Setup Nginx thủ công trên VPS

## Tổng quan

Jenkins sẽ chỉ deploy Frontend container. Nginx sẽ được cài đặt và cấu hình thủ công trên VPS để:
- Reverse proxy đến Frontend container (chạy trên `localhost:8080`)
- Cấu hình SSL/HTTPS với Let's Encrypt
- Redirect HTTP → HTTPS

## Kiến trúc

```
Internet (HTTPS) → Nginx trên VPS (443) → Frontend Container (localhost:8080)
Internet (HTTP)  → Nginx trên VPS (80)  → Redirect to HTTPS
```

## Bước 1: Cài đặt Nginx trên VPS

```bash
# Update package list
sudo apt update

# Cài đặt Nginx
sudo apt install -y nginx

# Kiểm tra Nginx đã chạy
sudo systemctl status nginx
```

## Bước 2: Tạo cấu hình Nginx

Tạo file cấu hình cho domain của bạn:

```bash
sudo nano /etc/nginx/sites-available/itworks-frontend
```

Copy nội dung sau (thay `itworks.dpdns.org` bằng domain của bạn):

```nginx
# Upstream đến Frontend container
upstream frontend {
    server 127.0.0.1:8080;
}

# HTTP server - redirect to HTTPS
server {
    listen 80;
    server_name itworks.dpdns.org www.itworks.dpdns.org;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all HTTP to HTTPS (sẽ enable sau khi có SSL)
    # return 301 https://$host$request_uri;
    
    # Tạm thời proxy HTTP (comment sau khi có SSL)
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://frontend/health;
        proxy_set_header Host $host;
    }
}

# HTTPS server (uncomment sau khi có SSL certificate)
# server {
#     listen 443 ssl http2;
#     server_name itworks.dpdns.org www.itworks.dpdns.org;
#     
#     # SSL certificates
#     ssl_certificate /etc/letsencrypt/live/itworks.dpdns.org/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/itworks.dpdns.org/privkey.pem;
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
#     proxy_set_header Host $host;
#     proxy_set_header X-Real-IP $remote_addr;
#     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#     proxy_set_header X-Forwarded-Proto $scheme;
#     proxy_set_header X-Forwarded-Host $host;
#     proxy_set_header X-Forwarded-Port $server_port;
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
#         proxy_set_header Host $host;
#     }
#     
#     # Frontend application
#     location / {
#         proxy_pass http://frontend;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
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
```

## Bước 3: Enable site

```bash
# Tạo symbolic link
sudo ln -s /etc/nginx/sites-available/itworks-frontend /etc/nginx/sites-enabled/

# Xóa default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test cấu hình
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Bước 4: Cài đặt SSL Certificate với Let's Encrypt

```bash
# Cài đặt Certbot
sudo apt install -y certbot python3-certbot-nginx

# Đảm bảo domain đã trỏ về IP VPS
# Kiểm tra:
dig +short itworks.dpdns.org

# Lấy SSL certificate
sudo certbot --nginx -d itworks.dpdns.org -d www.itworks.dpdns.org

# Certbot sẽ tự động:
# - Tạo SSL certificate
# - Cập nhật cấu hình Nginx để enable HTTPS
# - Setup auto-renewal
```

## Bước 5: Cập nhật cấu hình Nginx sau khi có SSL

Sau khi Certbot chạy xong, nó sẽ tự động cập nhật file cấu hình. Bạn có thể kiểm tra:

```bash
sudo nano /etc/nginx/sites-available/itworks-frontend
```

Certbot sẽ tự động:
- Uncomment HTTPS server block
- Enable HTTP → HTTPS redirect
- Cấu hình SSL certificates

Nếu cần chỉnh sửa thủ công, uncomment HTTPS server block và enable redirect:

```nginx
# Enable redirect trong HTTP server block
return 301 https://$host$request_uri;
```

Sau đó reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Bước 6: Kiểm tra

```bash
# Kiểm tra Nginx status
sudo systemctl status nginx

# Kiểm tra HTTP
curl -I http://itworks.dpdns.org

# Kiểm tra HTTPS
curl -I https://itworks.dpdns.org

# Kiểm tra SSL
openssl s_client -connect itworks.dpdns.org:443 -servername itworks.dpdns.org
```

## Bước 7: Cấu hình Firewall

```bash
# Cho phép HTTP và HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Kiểm tra firewall status
sudo ufw status
```

## Auto-renewal SSL Certificate

Certbot tự động setup cron job để renew certificate. Kiểm tra:

```bash
# Xem cron job
sudo cat /etc/cron.d/certbot

# Test renewal (dry-run)
sudo certbot renew --dry-run
```

## Troubleshooting

### Lỗi: "502 Bad Gateway"

```bash
# Kiểm tra Frontend container có chạy không
docker ps | grep itworks-frontend

# Kiểm tra container có listen trên port 8080
docker port itworks-frontend

# Kiểm tra logs
docker logs itworks-frontend

# Test connection từ VPS
curl http://localhost:8080/health
```

### Lỗi: "Connection refused"

```bash
# Kiểm tra Nginx có thể connect đến container
sudo nginx -t

# Kiểm tra upstream trong nginx config
# Đảm bảo: server 127.0.0.1:8080;
```

### Lỗi: "SSL certificate not found"

```bash
# Kiểm tra certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Kiểm tra file certificate
sudo ls -la /etc/letsencrypt/live/itworks.dpdns.org/
```

### Xem logs

```bash
# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Frontend container logs
docker logs -f itworks-frontend
```

## Cập nhật cấu hình sau khi deploy mới

Sau mỗi lần Jenkins deploy Frontend container mới:
1. Container sẽ tự động restart với image mới
2. Nginx không cần restart (vì proxy đến `localhost:8080` không đổi)
3. Nếu cần, reload Nginx: `sudo systemctl reload nginx`

## Backup cấu hình

```bash
# Backup Nginx config
sudo cp /etc/nginx/sites-available/itworks-frontend /backup/nginx-itworks-frontend-$(date +%Y%m%d).conf

# Backup SSL certificates
sudo tar -czf /backup/ssl-$(date +%Y%m%d).tar.gz /etc/letsencrypt/
```

## Kết quả

Sau khi setup xong:
- ✅ Frontend truy cập qua: `https://itworks.dpdns.org`
- ✅ HTTP tự động redirect sang HTTPS
- ✅ SSL certificate tự động renew
- ✅ Security headers được cấu hình
- ✅ Static assets được cache

