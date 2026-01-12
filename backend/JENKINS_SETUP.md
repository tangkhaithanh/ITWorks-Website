# Hướng dẫn Setup Jenkins CI/CD cho Backend

## 1. Cài đặt Jenkins trên VPS

### Cài đặt Jenkins
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-17-jdk -y
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo apt-key add -
sudo sh -c 'echo deb http://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'
sudo apt update
sudo apt install jenkins -y
sudo systemctl start jenkins
sudo systemctl enable jenkins
```

### Cài đặt Docker cho Jenkins user
```bash
# Thêm jenkins user vào docker group
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### Cài đặt Docker (nếu chưa có)
```bash
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker
```

## 2. Cấu hình Jenkins

### Truy cập Jenkins
1. Mở browser: `http://your-vps-ip:8080`
2. Lấy initial password: `sudo cat /var/lib/jenkins/secrets/initialAdminPassword`
3. Cài đặt suggested plugins

### Cài đặt Plugins cần thiết
1. Vào **Manage Jenkins** → **Plugins**
2. Cài đặt:
   - **Pipeline** (thường đã có sẵn)
   - **Docker Pipeline** (nếu cần)
   - **Git** (thường đã có sẵn)

## 3. Tạo Jenkins Pipeline

### Cách 1: Pipeline từ SCM (Recommended)

1. Vào **New Item** → Chọn **Pipeline**
2. Đặt tên: `itworks-backend`
3. Trong **Pipeline** section:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/your-username/ITWorks-Website.git`
   - Credentials: Thêm GitHub credentials nếu repo private
   - Branch: `*/main` hoặc `*/master`
   - Script Path: `backend/Jenkinsfile`

### Cách 2: Pipeline script trực tiếp

Copy nội dung từ `Jenkinsfile` vào Jenkins UI.

## 4. Cấu hình Environment Variables (.env)

### Cách 1: Tạo file .env trong workspace

1. Vào **Manage Jenkins** → **Files**
2. Tạo file `.env` trong thư mục `backend/` với nội dung:
```env
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_ACCESS_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
# ... các biến khác
```

### Cách 2: Dùng Jenkins Credentials (Recommended)

1. Vào **Manage Jenkins** → **Credentials** → **System** → **Global credentials**
2. Add Credentials:
   - Kind: **Secret file**
   - File: Upload file `.env`
   - ID: `backend-env-file`
3. Sửa Jenkinsfile để load từ credentials:
```groovy
stage('Deploy') {
    steps {
        script {
            withCredentials([file(credentialsId: 'backend-env-file', variable: 'ENV_FILE')]) {
                sh """
                    cp ${ENV_FILE} backend/.env
                    docker run -d \\
                        --name ${CONTAINER_NAME} \\
                        --restart unless-stopped \\
                        -p ${HOST_PORT}:${APP_PORT} \\
                        --env-file backend/.env \\
                        ${IMAGE_NAME}:${BUILD_NUMBER}
                """
            }
        }
    }
}
```

### Cách 3: Dùng Environment Variables trong Jenkins

1. Vào **Manage Jenkins** → **Configure System** → **Global properties**
2. Thêm **Environment variables**:
   - `DATABASE_URL=...`
   - `JWT_ACCESS_SECRET=...`
   - etc.
3. Sửa Jenkinsfile để inject env vars:
```groovy
sh """
    docker run -d \\
        --name ${CONTAINER_NAME} \\
        --restart unless-stopped \\
        -p ${HOST_PORT}:${APP_PORT} \\
        -e DATABASE_URL=\${DATABASE_URL} \\
        -e JWT_ACCESS_SECRET=\${JWT_ACCESS_SECRET} \\
        ${IMAGE_NAME}:${BUILD_NUMBER}
"""
```

## 5. Cấu hình GitHub Webhook (Optional)

Để tự động trigger build khi có push:

1. Vào GitHub repo → **Settings** → **Webhooks**
2. Add webhook:
   - Payload URL: `http://your-vps-ip:8080/github-webhook/`
   - Content type: `application/json`
   - Events: Chọn **Just the push event**

## 6. Chạy Pipeline

1. Vào Jenkins dashboard
2. Click vào pipeline `itworks-backend`
3. Click **Build Now**
4. Xem logs trong **Console Output**

## 7. Troubleshooting

### Lỗi permission Docker
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### Lỗi không tìm thấy .env
- Kiểm tra file .env có trong workspace không
- Kiểm tra đường dẫn trong Jenkinsfile

### Lỗi port đã được sử dụng
```bash
# Kiểm tra container cũ
docker ps -a | grep itworks-backend

# Xóa container cũ
docker rm -f itworks-backend
```

### Xem logs container
```bash
docker logs itworks-backend
docker logs -f itworks-backend  # follow logs
```

## 8. Cấu trúc thư mục trên VPS

```
/var/lib/jenkins/workspace/itworks-backend/
├── backend/
│   ├── .env (được tạo từ Jenkins)
│   ├── Dockerfile
│   ├── Jenkinsfile
│   └── ...
└── ...
```

## 9. Best Practices

1. **Backup .env**: Lưu backup file .env ở nơi an toàn
2. **Secrets Management**: Dùng Jenkins Credentials thay vì hardcode
3. **Rollback**: Giữ lại các image cũ để có thể rollback
4. **Monitoring**: Setup monitoring cho container
5. **Logs**: Cấu hình log rotation cho Docker containers

