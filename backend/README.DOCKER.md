# Hướng dẫn chạy Backend với Docker

## 1. Tạo file .env

Tạo file `.env` trong thư mục `backend/` với nội dung:

```env
# Server
PORT=3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/itworks_db?schema=public"

# JWT
JWT_ACCESS_SECRET=your_access_secret_key_here_change_in_production
JWT_REFRESH_SECRET=your_refresh_secret_key_here_change_in_production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Mailer (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password_here
MAIL_FROM="No Reply <no-reply@example.com>"

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
```

## 2. Build Docker image

```bash
cd backend
docker build -t itworks-backend .
```

## 3. Chạy Docker container với file .env

```bash
docker run -d \
  --name itworks-backend \
  -p 3000:3000 \
  --env-file .env \
  itworks-backend
```

## 4. Xem logs

```bash
docker logs -f itworks-backend
```

## 5. Dừng và xóa container

```bash
docker stop itworks-backend
docker rm itworks-backend
```

## Lưu ý

- Đảm bảo database PostgreSQL đã chạy và có thể kết nối từ container
- Nếu database chạy trên host, sử dụng `host.docker.internal` thay vì `localhost` trong DATABASE_URL
- Ví dụ: `DATABASE_URL="postgresql://user:password@host.docker.internal:5432/itworks_db?schema=public"`

