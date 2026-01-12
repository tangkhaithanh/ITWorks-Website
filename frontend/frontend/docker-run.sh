#!/bin/bash

# Script để build và chạy Docker container cho frontend

set -e

# Màu sắc cho output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🐳 Bắt đầu build Docker image cho frontend...${NC}"

# Build image
docker build -t itworks-frontend .

echo -e "${GREEN}✅ Build thành công!${NC}"

# Dừng và xóa container cũ nếu có
if [ "$(docker ps -aq -f name=itworks-frontend)" ]; then
    echo -e "${YELLOW}🛑 Dừng container cũ...${NC}"
    docker stop itworks-frontend 2>/dev/null || true
    docker rm itworks-frontend 2>/dev/null || true
fi

# Chạy container mới
echo -e "${GREEN}🚀 Chạy container mới...${NC}"
docker run -d \
  --name itworks-frontend \
  -p 5173:80 \
  itworks-frontend

echo -e "${GREEN}✅ Container đã chạy!${NC}"
echo -e "${YELLOW}🌐 Frontend đang chạy tại: http://localhost:5173${NC}"
echo -e "${YELLOW}📋 Xem logs: docker logs -f itworks-frontend${NC}"
echo -e "${YELLOW}🛑 Dừng container: docker stop itworks-frontend${NC}"
echo -e "${YELLOW}🗑️  Xóa container: docker rm itworks-frontend${NC}"

