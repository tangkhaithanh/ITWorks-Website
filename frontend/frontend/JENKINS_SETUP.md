# Hướng dẫn Setup Jenkins CI/CD cho Frontend

## 1. Cài đặt Jenkins trên VPS

Xem hướng dẫn trong `backend/JENKINS_SETUP.md` để cài đặt Jenkins và Docker.

## 2. Cấu hình Jenkins Pipeline

### Cách 1: Pipeline từ SCM (Recommended)

1. Vào **New Item** → Chọn **Pipeline**
2. Đặt tên: `itworks-frontend`
3. Trong **Pipeline** section:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/your-username/ITWorks-Website.git`
   - Credentials: Thêm GitHub credentials nếu repo private
   - Branch: `*/main` hoặc `*/master`
   - Script Path: `frontend/frontend/Jenkinsfile`

### Cách 2: Pipeline script trực tiếp

Copy nội dung từ `Jenkinsfile` vào Jenkins UI.

## 3. Cấu hình Environment Variables (Optional)

Frontend sử dụng Vite, nên build-time variables cần prefix `VITE_`.

### Nếu cần thay đổi API URL hoặc các biến khác:

1. Vào **Manage Jenkins** → **Credentials** → **System** → **Global credentials**
2. Add Credentials:
   - Kind: **Secret file**
   - File: Upload file `.env` với nội dung:
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_APP_NAME=ITWorks
   # ... các biến khác với prefix VITE_
   ```
   - ID: `frontend-env-file`
3. Sử dụng `Jenkinsfile.with-env` thay vì `Jenkinsfile`

### Nếu không cần build-time variables:

Dùng `Jenkinsfile` mặc định (không cần .env file).

## 4. Cấu hình GitHub Webhook (Optional)

Để tự động trigger build khi có push:

1. Vào GitHub repo → **Settings** → **Webhooks**
2. Add webhook:
   - Payload URL: `http://your-vps-ip:8080/github-webhook/`
   - Content type: `application/json`
   - Events: Chọn **Just the push event**

## 5. Chạy Pipeline

1. Vào Jenkins dashboard
2. Click vào pipeline `itworks-frontend`
3. Click **Build Now**
4. Xem logs trong **Console Output**

## 6. Truy cập Frontend

Sau khi deploy thành công, frontend sẽ chạy tại:
- `http://your-vps-ip:5173`

## 7. Troubleshooting

### Lỗi permission Docker
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### Lỗi port đã được sử dụng
```bash
# Kiểm tra container cũ
docker ps -a | grep itworks-frontend

# Xóa container cũ
docker rm -f itworks-frontend
```

### Lỗi build failed
- Kiểm tra logs trong Jenkins Console Output
- Kiểm tra xem có đủ disk space không: `df -h`
- Kiểm tra Docker: `docker ps`

### Xem logs container
```bash
docker logs itworks-frontend
docker logs -f itworks-frontend  # follow logs
```

### Rebuild image thủ công
```bash
cd /var/lib/jenkins/workspace/itworks-frontend/frontend/frontend
docker build -t itworks-frontend:latest .
docker stop itworks-frontend
docker rm itworks-frontend
docker run -d --name itworks-frontend -p 5173:80 itworks-frontend:latest
```

## 8. Cấu trúc thư mục trên VPS

```
/var/lib/jenkins/workspace/itworks-frontend/
├── frontend/
│   └── frontend/
│       ├── .env (nếu dùng Jenkinsfile.with-env)
│       ├── Dockerfile
│       ├── Jenkinsfile
│       └── ...
└── ...
```

## 9. Best Practices

1. **Build Optimization**: Vite đã optimize build tự động
2. **Caching**: Docker layer caching giúp build nhanh hơn
3. **Health Check**: Nginx health endpoint tại `/health`
4. **Rollback**: Giữ lại các image cũ để có thể rollback
5. **Monitoring**: Setup monitoring cho container
6. **CDN**: Có thể deploy static files lên CDN thay vì nginx

## 10. Khác biệt với Backend

| Feature | Backend | Frontend |
|---------|---------|----------|
| .env file | Cần thiết (runtime) | Optional (build-time) |
| Port | 3000 | 80 (container), 5173 (host) |
| Health check | API endpoint | Nginx endpoint |
| Restart policy | Cần thiết | Cần thiết |
| Database | Cần migrations | Không cần |

## 11. Multi-stage Pipeline (Advanced)

Nếu muốn tối ưu hơn, có thể tách build và deploy:

```groovy
stage('Build') {
    // Build image
}

stage('Deploy to Staging') {
    // Deploy to staging environment
}

stage('Test Staging') {
    // Run E2E tests
}

stage('Deploy to Production') {
    when {
        branch 'main'
    }
    // Deploy to production
}
```

## 12. Notification (Optional)

Thêm notification khi deploy thành công/thất bại:

```groovy
post {
    success {
        emailext (
            subject: "✅ Frontend Deployed Successfully - Build #${BUILD_NUMBER}",
            body: "Frontend đã được deploy thành công!",
            to: "team@example.com"
        )
    }
    failure {
        emailext (
            subject: "❌ Frontend Deploy Failed - Build #${BUILD_NUMBER}",
            body: "Frontend deploy thất bại. Vui lòng kiểm tra logs.",
            to: "team@example.com"
        )
    }
}
```

