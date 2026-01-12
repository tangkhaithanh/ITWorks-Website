# Hướng dẫn Setup Domain itworks.dpdns.org

## Domain: itworks.dpdns.org

## Bước 1: Kiểm tra DNS

Đảm bảo domain đã trỏ về IP VPS của bạn:

```bash
# Kiểm tra IP của domain
dig +short itworks.dpdns.org

# So sánh với IP VPS
curl ifconfig.me
```

Nếu chưa trỏ, cấu hình DNS record:
- Type: A
- Name: itworks (hoặc @)
- Value: IP VPS của bạn
- TTL: 3600

## Bước 2: Deploy Frontend qua Jenkins

1. Chạy Jenkins pipeline `itworks-frontend`
2. Pipeline sẽ tự động:
   - Build Frontend image
   - Build Nginx image (với domain itworks.dpdns.org)
   - Deploy containers

## Bước 3: Truy cập HTTP

Sau khi deploy, truy cập:
- `http://itworks.dpdns.org`

## Bước 4: Setup SSL (Optional nhưng khuyến nghị)

### Cách 1: Dùng script tự động

```bash
# Trên VPS
cd /var/lib/jenkins/workspace/itworks-frontend/frontend/frontend/nginx
sudo ./setup-ssl.sh admin@itworks.dpdns.org
```

Script sẽ:
- ✅ Cài Certbot
- ✅ Lấy SSL certificate
- ✅ Cập nhật Nginx config
- ✅ Rebuild Nginx image
- ✅ Deploy với SSL
- ✅ Setup auto-renewal

### Cách 2: Setup thủ công

#### 4.1. Cài Certbot

```bash
sudo apt update
sudo apt install -y certbot
```

#### 4.2. Stop Nginx container tạm thời

```bash
docker stop itworks-nginx
```

#### 4.3. Lấy SSL certificate

```bash
sudo certbot certonly --standalone \
    -d itworks.dpdns.org \
    -d www.itworks.dpdns.org \
    --email admin@itworks.dpdns.org \
    --agree-tos
```

#### 4.4. Cập nhật Nginx config

Uncomment HTTPS server block trong `nginx/nginx.conf`:
- Tìm dòng `# server {` và đổi thành `server {`
- Uncomment tất cả các dòng trong HTTPS server block
- Enable HTTP to HTTPS redirect

#### 4.5. Rebuild Nginx image

```bash
cd frontend/frontend/nginx
docker build -t itworks-nginx:latest .
```

#### 4.6. Deploy Nginx với SSL

```bash
docker run -d \
    --name itworks-nginx \
    --restart unless-stopped \
    -p 80:80 \
    -p 443:443 \
    -v /etc/letsencrypt:/etc/letsencrypt:ro \
    --network itworks-network \
    itworks-nginx:latest
```

#### 4.7. Setup auto-renewal

```bash
sudo certbot renew --dry-run
```

Tạo cron job:
```bash
sudo crontab -e
```

Thêm dòng:
```
0 0 * * * certbot renew --quiet --deploy-hook "docker restart itworks-nginx"
```

## Bước 5: Cập nhật trong Jenkins (nếu dùng SSL)

Cập nhật Jenkinsfile để mount SSL certificates:

```groovy
stage('Deploy Nginx') {
    steps {
        sh """
            docker run -d \\
                --name ${NGINX_CONTAINER_NAME} \\
                --restart unless-stopped \\
                -p ${NGINX_HTTP_PORT}:80 \\
                -p ${NGINX_HTTPS_PORT}:443 \\
                -v /etc/letsencrypt:/etc/letsencrypt:ro \\
                --network ${DOCKER_NETWORK} \\
                ${NGINX_IMAGE_NAME}:${BUILD_NUMBER}
        """
    }
}
```

## Kiểm tra

### Kiểm tra HTTP
```bash
curl http://itworks.dpdns.org/health
```

### Kiểm tra HTTPS (nếu đã setup SSL)
```bash
curl https://itworks.dpdns.org/health
```

### Kiểm tra SSL certificate
```bash
openssl s_client -connect itworks.dpdns.org:443 -servername itworks.dpdns.org
```

### Test SSL online
- https://www.ssllabs.com/ssltest/analyze.html?d=itworks.dpdns.org

## Troubleshooting

### Lỗi: "Domain not pointing to this server"
- Kiểm tra DNS: `dig +short itworks.dpdns.org`
- Đảm bảo domain trỏ về đúng IP VPS

### Lỗi: "Port 80 already in use"
- Kiểm tra: `sudo netstat -tlnp | grep :80`
- Stop service đang dùng port 80

### Lỗi: "Certificate not found"
- Kiểm tra: `sudo certbot certificates`
- Renew: `sudo certbot renew`

### Lỗi: "502 Bad Gateway"
- Kiểm tra frontend container: `docker ps | grep itworks-frontend`
- Kiểm tra logs: `docker logs itworks-frontend`
- Kiểm tra network: `docker network inspect itworks-network`

## Kết quả

Sau khi setup xong:
- ✅ HTTP: `http://itworks.dpdns.org`
- ✅ HTTPS: `https://itworks.dpdns.org` (nếu đã setup SSL)
- ✅ Auto-renewal SSL (nếu đã setup)
- ✅ Security headers
- ✅ Gzip compression
- ✅ Static assets caching

## Lưu ý

1. **DNS Propagation**: Sau khi cấu hình DNS, có thể mất 5-30 phút để propagate
2. **SSL Renewal**: Certificates tự động renew mỗi 90 ngày
3. **Backup**: Backup SSL certificates định kỳ
4. **Monitoring**: Monitor SSL expiration và domain status

