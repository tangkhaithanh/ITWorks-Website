# Hướng dẫn Setup Nginx Reverse Proxy trong Docker (Jenkins CI/CD)

## Tổng quan

Tất cả được chạy trong Docker containers thông qua Jenkins:
- **Frontend Container**: Chạy ứng dụng React (port 80 trong container)
- **Nginx Container**: Reverse proxy (port 80/443 ra ngoài)
- **Docker Network**: Kết nối các containers

## Kiến trúc

```
Internet (Port 80/443)
    ↓
Nginx Container (itworks-nginx)
    ↓ (Docker Network)
Frontend Container (itworks-frontend:80)
    ↓
React App
```

## Cấu trúc Files

```
frontend/frontend/
├── Dockerfile              # Frontend app
├── Jenkinsfile            # CI/CD pipeline
├── nginx/
│   ├── Dockerfile         # Nginx reverse proxy
│   └── nginx.conf         # Nginx configuration
└── ...
```

## Jenkinsfile đã được cấu hình

Jenkinsfile tự động:
1. ✅ Tạo Docker network
2. ✅ Build Frontend image
3. ✅ Build Nginx image
4. ✅ Deploy Frontend container (không expose port)
5. ✅ Deploy Nginx container (expose port 80/443)
6. ✅ Health check qua Nginx

## Cách sử dụng

### 1. Setup Jenkins Pipeline

1. Vào Jenkins → **New Item** → **Pipeline**
2. Đặt tên: `itworks-frontend`
3. Pipeline script from SCM:
   - Repository: GitHub repo của bạn
   - Script Path: `frontend/frontend/Jenkinsfile`

### 2. Chạy Pipeline

Click **Build Now** - Jenkins sẽ tự động:
- Build cả Frontend và Nginx images
- Deploy containers
- Setup network

### 3. Truy cập

Sau khi deploy thành công:
- HTTP: `http://your-vps-ip`
- HTTPS: `https://your-vps-ip` (nếu đã setup SSL)

## Setup SSL trong Docker (Optional)

### Cách 1: Mount SSL certificates từ host

1. Cài SSL trên host (dùng certbot):
```bash
sudo certbot certonly --standalone -d your-domain.com
```

2. Cập nhật Jenkinsfile để mount certificates:
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

3. Uncomment HTTPS server block trong `nginx/nginx.conf`

### Cách 2: Dùng certbot trong container

Tạo thêm stage trong Jenkinsfile để chạy certbot trong container:

```groovy
stage('Setup SSL') {
    steps {
        script {
            sh """
                docker run --rm \\
                    -v certbot-certs:/etc/letsencrypt \\
                    -v certbot-www:/var/www/certbot \\
                    certbot/certbot certonly \\
                    --webroot \\
                    --webroot-path=/var/www/certbot \\
                    --email admin@your-domain.com \\
                    --agree-tos \\
                    --no-eff-email \\
                    -d your-domain.com
            """
        }
    }
}
```

## Kiểm tra và Troubleshooting

### Kiểm tra containers
```bash
docker ps | grep itworks
```

### Kiểm tra network
```bash
docker network inspect itworks-network
```

### Xem logs
```bash
# Frontend logs
docker logs itworks-frontend

# Nginx logs
docker logs itworks-nginx
```

### Test từ trong network
```bash
# Test frontend container
docker exec itworks-nginx curl http://itworks-frontend/health

# Test nginx
curl http://localhost/health
```

### Restart containers
```bash
docker restart itworks-frontend
docker restart itworks-nginx
```

## Cấu hình Nginx

File `nginx/nginx.conf` đã được cấu hình sẵn:
- ✅ Proxy đến `itworks-frontend:80`
- ✅ Health check endpoint
- ✅ Gzip compression
- ✅ Security headers (khi có SSL)

### Tùy chỉnh

Sửa file `nginx/nginx.conf` và rebuild image:
```bash
cd frontend/frontend/nginx
docker build -t itworks-nginx:latest .
```

## Lợi ích của cách này

1. ✅ **Tất cả trong Docker**: Không cần cài Nginx trên host
2. ✅ **Tự động hóa**: Jenkins tự động build và deploy
3. ✅ **Isolation**: Mỗi service trong container riêng
4. ✅ **Dễ scale**: Có thể scale frontend containers
5. ✅ **Dễ rollback**: Chỉ cần rollback image

## So sánh với setup trên host

| Feature | Host Nginx | Docker Nginx |
|---------|------------|--------------|
| Setup | Phức tạp | Tự động qua Jenkins |
| Maintenance | Manual | Tự động |
| Isolation | Không | Có |
| Port conflict | Có thể | Không (trong container) |
| SSL setup | Phức tạp | Có thể mount từ host |

## Best Practices

1. **Network**: Luôn dùng Docker network để containers giao tiếp
2. **Health checks**: Kiểm tra cả frontend và nginx
3. **Logs**: Monitor logs của cả 2 containers
4. **Backup**: Backup nginx config và SSL certificates
5. **Monitoring**: Setup monitoring cho cả containers

## Troubleshooting

### Lỗi: "Cannot connect to frontend"
- Kiểm tra network: `docker network inspect itworks-network`
- Kiểm tra frontend container có trong network không
- Kiểm tra nginx config có đúng tên container không

### Lỗi: "502 Bad Gateway"
- Kiểm tra frontend container có chạy không
- Kiểm tra logs: `docker logs itworks-frontend`
- Test từ nginx: `docker exec itworks-nginx curl http://itworks-frontend/health`

### Lỗi: "Port already in use"
- Kiểm tra port 80/443 có bị chiếm không: `netstat -tlnp | grep -E ':(80|443)'`
- Stop container cũ: `docker stop itworks-nginx`

## Kết quả

Sau khi setup:
- ✅ Frontend chạy trong Docker container
- ✅ Nginx reverse proxy chạy trong Docker container
- ✅ Tự động deploy qua Jenkins
- ✅ Truy cập qua port 80/443
- ✅ Có thể setup SSL sau

