# Hướng dẫn SSL Setup trong Jenkins Pipeline

## Tổng quan

Jenkinsfile đã được cấu hình để tự động setup SSL cho domain `itworks.dpdns.org` trong quá trình deploy.

## Cách hoạt động

### Lần đầu tiên chạy pipeline:

1. ✅ Build Frontend và Nginx images
2. ✅ Deploy Frontend container
3. ✅ **Setup SSL**: 
   - Tạm thời deploy Nginx để certbot verify domain
   - Cài đặt certbot và lấy SSL certificate
   - Enable HTTPS trong nginx.conf
   - Rebuild Nginx image với HTTPS enabled
4. ✅ Deploy Nginx với SSL certificates mounted
5. ✅ Setup auto-renewal cho SSL

### Các lần chạy sau:

- Nếu SSL đã tồn tại: Bỏ qua bước tạo SSL, chỉ rebuild và deploy
- Nếu SSL chưa có: Tự động tạo mới

## Yêu cầu

### 1. Domain DNS

Đảm bảo domain `itworks.dpdns.org` đã trỏ về IP VPS:

```bash
# Kiểm tra DNS
dig +short itworks.dpdns.org

# So sánh với IP VPS
curl ifconfig.me
```

### 2. Port 80 phải mở

Certbot cần port 80 để verify domain. Đảm bảo:
- Firewall cho phép port 80
- Không có service nào đang dùng port 80 (trừ Nginx container tạm thời)

### 3. Jenkins user có quyền

Jenkins user cần quyền:
- Chạy Docker (đã có nếu đã setup)
- Chạy certbot (sẽ được cài trong pipeline)
- Tạo cron jobs (cho auto-renewal)

## Chạy Pipeline

1. Vào Jenkins dashboard
2. Click vào pipeline `itworks-frontend`
3. Click **Build Now**
4. Xem logs trong **Console Output**

## Kết quả

Sau khi pipeline chạy thành công:

- ✅ HTTP: `http://itworks.dpdns.org`
- ✅ HTTPS: `https://itworks.dpdns.org` (nếu SSL được tạo thành công)
- ✅ Auto-renewal: SSL tự động renew mỗi ngày lúc 00:00
- ✅ HTTP → HTTPS redirect: Tự động redirect

## Kiểm tra SSL

### Kiểm tra certificate
```bash
sudo certbot certificates
```

### Kiểm tra SSL online
- https://www.ssllabs.com/ssltest/analyze.html?d=itworks.dpdns.org

### Test HTTPS
```bash
curl -I https://itworks.dpdns.org
```

## Troubleshooting

### Lỗi: "Domain not pointing to this server"

**Nguyên nhân**: Domain chưa trỏ về IP VPS

**Giải pháp**:
1. Kiểm tra DNS: `dig +short itworks.dpdns.org`
2. Cấu hình DNS record trỏ về IP VPS
3. Đợi DNS propagate (5-30 phút)
4. Chạy lại pipeline

### Lỗi: "Port 80 already in use"

**Nguyên nhân**: Có service khác đang dùng port 80

**Giải pháp**:
```bash
# Kiểm tra service đang dùng port 80
sudo netstat -tlnp | grep :80

# Stop service (nếu không cần thiết)
sudo systemctl stop <service-name>
```

### Lỗi: "Failed to obtain certificate"

**Nguyên nhân**: 
- Domain chưa trỏ về IP
- Port 80 bị block
- Rate limit từ Let's Encrypt

**Giải pháp**:
1. Kiểm tra DNS
2. Kiểm tra firewall
3. Đợi một chút nếu bị rate limit (5 certificates/domain/week)

### Lỗi: "Permission denied" khi tạo cron job

**Nguyên nhân**: Jenkins user không có quyền tạo cron job

**Giải pháp**:
```bash
# Thêm Jenkins user vào sudoers (nếu cần)
sudo visudo
# Thêm dòng: jenkins ALL=(ALL) NOPASSWD: /usr/bin/certbot
```

Hoặc tạo cron job thủ công:
```bash
sudo crontab -e
# Thêm: 0 0 * * * certbot renew --quiet --deploy-hook "docker restart itworks-nginx"
```

## Manual SSL Setup (nếu pipeline fail)

Nếu pipeline không thể tự động setup SSL, có thể làm thủ công:

```bash
# 1. Stop Nginx container
docker stop itworks-nginx

# 2. Cài certbot
sudo apt update
sudo apt install -y certbot

# 3. Lấy certificate
sudo certbot certonly --standalone \
    -d itworks.dpdns.org \
    -d www.itworks.dpdns.org \
    --email admin@itworks.dpdns.org \
    --agree-tos

# 4. Enable HTTPS trong nginx.conf (uncomment HTTPS server block)

# 5. Rebuild Nginx image
cd /var/lib/jenkins/workspace/itworks-frontend/frontend/frontend/nginx
docker build -t itworks-nginx:latest .

# 6. Deploy Nginx với SSL
docker run -d \
    --name itworks-nginx \
    --restart unless-stopped \
    -p 80:80 \
    -p 443:443 \
    -v /etc/letsencrypt:/etc/letsencrypt:ro \
    --network itworks-network \
    itworks-nginx:latest
```

## Auto-Renewal

SSL certificate tự động renew:
- **Schedule**: Mỗi ngày lúc 00:00
- **Action**: Renew certificate và restart Nginx container
- **Logs**: `/var/log/letsencrypt/letsencrypt.log`

Kiểm tra auto-renewal:
```bash
# Test renewal (dry-run)
sudo certbot renew --dry-run

# Xem cron jobs
crontab -l
```

## Best Practices

1. **Monitor SSL expiration**: Setup monitoring để cảnh báo trước khi hết hạn
2. **Backup certificates**: Backup `/etc/letsencrypt` định kỳ
3. **Test renewal**: Test renewal trước khi production
4. **DNS monitoring**: Monitor DNS để đảm bảo domain luôn trỏ đúng
5. **Log monitoring**: Monitor certbot logs để phát hiện lỗi sớm

## Kết quả mong đợi

Sau khi setup thành công:
- ✅ HTTPS hoạt động: `https://itworks.dpdns.org`
- ✅ HTTP redirect sang HTTPS
- ✅ Security headers được cấu hình
- ✅ SSL grade A (từ SSL Labs)
- ✅ Auto-renewal hoạt động

