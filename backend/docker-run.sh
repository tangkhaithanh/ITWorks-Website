#!/bin/bash

# Script để build và chạy Docker container với file .env

set -e

# Màu sắc cho output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🐳 Bắt đầu build Docker image...${NC}"

# Build image
docker build -t itworks-backend .

echo -e "${GREEN}✅ Build thành công!${NC}"

# Kiểm tra file .env
if [ ! -f .env ]; then
    echo -e "${RED}❌ Không tìm thấy file .env!${NC}"
    echo -e "${YELLOW}Vui lòng tạo file .env trước khi chạy.${NC}"
    exit 1
fi

echo -e "${GREEN}📝 Đã tìm thấy file .env${NC}"

# Dừng và xóa container cũ nếu có
if [ "$(docker ps -aq -f name=itworks-backend)" ]; then
    echo -e "${YELLOW}🛑 Dừng container cũ...${NC}"
    docker stop itworks-backend 2>/dev/null || true
    docker rm itworks-backend 2>/dev/null || true
fi

# Chạy container mới
echo -e "${GREEN}🚀 Chạy container mới...${NC}"
docker run -d \
  --name itworks-backend \
  -p 3000:3000 \
  --env-file .env \
  itworks-backend

echo -e "${GREEN}✅ Container đã chạy!${NC}"
echo -e "${YELLOW}📋 Xem logs: docker logs -f itworks-backend${NC}"
echo -e "${YELLOW}🛑 Dừng container: docker stop itworks-backend${NC}"
echo -e "${YELLOW}🗑️  Xóa container: docker rm itworks-backend${NC}"

