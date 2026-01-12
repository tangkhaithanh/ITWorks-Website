# Hướng dẫn Setup SSL cho Frontend

## Vấn đề: Jenkins user không có quyền sudo

Nếu bạn thấy lỗi:
```
sudo: a password is required
```

Có nghĩa là Jenkins user chưa được cấu hình để chạy sudo không cần password.

## Giải pháp: Cấu hình sudo cho Jenkins user

### Bước 1: Cấp quyền sudo cho Jenkins user

Chạy lệnh sau trên VPS:

```bash
sudo visudo
```

### Bước 2: Thêm dòng sau vào cuối file

```
jenkins ALL=(ALL) NOPASSWD: /usr/bin/apt-get, /usr/bin/certbot, /usr/bin/test
```

Hoặc cho phép tất cả (ít bảo mật hơn nhưng dễ hơn):

```
jenkins ALL=(ALL) NOPASSWD: ALL
```

### Bước 3: Lưu và thoát

- Nhấn `Ctrl + X`
- Nhấn `Y` để xác nhận
- Nhấn `Enter` để lưu

### Bước 4: Kiểm tra

```bash
sudo -u jenkins sudo -n true
```

Nếu không có lỗi, cấu hình đã thành công.

## Chạy lại Jenkins Pipeline

Sau khi cấu hình sudo, chạy lại Jenkins pipeline `itworks-frontend`. Pipeline sẽ tự động:

1. ✅ Kiểm tra quyền sudo
2. ✅ Tạo SSL certificate (nếu chưa có)
3. ✅ Enable HTTPS trong Nginx
4. ✅ Deploy với SSL
5. ✅ Setup auto-renewal

## Kết quả

Sau khi setup thành công:
- ✅ HTTP: `http://itworks.dpdns.org`
- ✅ HTTPS: `https://itworks.dpdns.org`
- ✅ HTTP → HTTPS redirect tự động
- ✅ SSL auto-renewal mỗi ngày

## Nếu không muốn dùng sudo

Nếu không muốn cấp quyền sudo cho Jenkins, bạn có thể:

### Cách 1: Setup SSL thủ công trước

```bash
# Trên VPS (với quyền root)
sudo apt-get update
sudo apt-get install -y certbot

# Stop Nginx container tạm thời
docker stop itworks-nginx

# Tạo SSL certificate
sudo certbot certonly --standalone \
    -d itworks.dpdns.org \
    -d www.itworks.dpdns.org \
    --email admin@itworks.dpdns.org \
    --agree-tos

# Start lại Nginx container
docker start itworks-nginx
```

Sau đó chạy Jenkins pipeline - nó sẽ detect SSL đã có và enable HTTPS.

### Cách 2: Dùng certbot trong Docker container

Có thể modify Jenkinsfile để chạy certbot trong Docker container thay vì trên host, nhưng phức tạp hơn.

## Troubleshooting

### Lỗi: "Domain not pointing to this server"
- Kiểm tra DNS: `dig +short itworks.dpdns.org`
- Đảm bảo domain trỏ về IP VPS

### Lỗi: "Port 80 already in use"
- Kiểm tra: `sudo netstat -tlnp | grep :80`
- Stop service đang dùng port 80

### Lỗi: "Permission denied" khi mount SSL
- Kiểm tra quyền: `ls -la /etc/letsencrypt/`
- Đảm bảo Jenkins user có thể đọc: `sudo chmod -R 755 /etc/letsencrypt`

## Best Practice

1. **Chỉ cấp quyền cần thiết**: Thay vì `NOPASSWD: ALL`, chỉ cấp các lệnh cụ thể
2. **Monitor SSL expiration**: Setup monitoring để cảnh báo trước khi hết hạn
3. **Backup certificates**: Backup `/etc/letsencrypt` định kỳ
4. **Test renewal**: Test SSL renewal trước khi production

