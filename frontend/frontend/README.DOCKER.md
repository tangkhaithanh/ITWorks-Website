# Hướng dẫn chạy Frontend với Docker

## 1. Build Docker image

```bash
cd frontend/frontend
docker build -t itworks-frontend .
```

## 2. Chạy Docker container

### Cách 1: Dùng script (đơn giản nhất)
```bash
chmod +x docker-run.sh
./docker-run.sh
```

### Cách 2: Chạy thủ công
```bash
docker run -d \
  --name itworks-frontend \
  -p 5173:80 \
  itworks-frontend
```

## 3. Xem logs

```bash
docker logs -f itworks-frontend
```

## 4. Dừng và xóa container

```bash
docker stop itworks-frontend
docker rm itworks-frontend
```

## 5. Rebuild và chạy lại

```bash
docker stop itworks-frontend
docker rm itworks-frontend
docker build -t itworks-frontend .
docker run -d --name itworks-frontend -p 5173:80 itworks-frontend
```

## Lưu ý

- Frontend được serve qua nginx trên port 80 trong container
- Port mapping: `5173:80` (host:container)
- Nếu muốn đổi port, sửa `-p 5173:80` thành `-p <port>:80`
- Frontend là SPA (Single Page Application), nginx đã được cấu hình để redirect tất cả routes về `/index.html`
- Không cần file `.env` cho frontend vì build-time variables được embed vào bundle khi build

## Environment Variables (nếu cần)

Nếu bạn cần thay đổi API endpoint hoặc các biến môi trường khác, bạn có thể:

1. Tạo file `.env` trong thư mục `frontend/frontend/`
2. Sử dụng Vite env variables (prefix `VITE_`)
3. Rebuild Docker image

Ví dụ `.env`:
```env
VITE_API_URL=http://localhost:3000
```

Sau đó rebuild:
```bash
docker build -t itworks-frontend .
```

