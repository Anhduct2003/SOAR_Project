# Hướng dẫn Khởi động Nhanh

## 🚀 Khởi động hệ thống trong 5 phút

### Yêu cầu hệ thống
- Ubuntu 20.04+ hoặc tương đương
- Docker và Docker Compose
- Ít nhất 4GB RAM
- 20GB dung lượng ổ cứng trống

### Bước 1: Clone và cài đặt
```bash
# Clone repository
git clone <repository-url>
cd security1

# Cấp quyền thực thi cho script setup
chmod +x setup.sh
```

### Bước 2: Khởi động hệ thống
```bash
# Chạy script setup tự động
./setup.sh setup
```

Script này sẽ:
- ✅ Kiểm tra dependencies
- ✅ Tạo file cấu hình .env
- ✅ Tạo thư mục logs
- ✅ Build và khởi động containers
- ✅ Kiểm tra health của services
- ✅ Hiển thị thông tin truy cập

### Bước 3: Truy cập hệ thống

Sau khi setup hoàn tất, bạn có thể truy cập:

| Dịch vụ | URL | Mô tả |
|---------|-----|-------|
| **Dashboard** | http://localhost:3000 | Giao diện chính |
| **Kibana** | http://localhost:5601 | Phân tích log |
| **API** | http://localhost:5000 | Backend API |
| **Elasticsearch** | http://localhost:9200 | Search engine |

### Bước 4: Đăng nhập

Sử dụng tài khoản mặc định:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@security.local | admin123 |
| **Analyst** | analyst@security.local | analyst123 |
| **Viewer** | viewer@security.local | viewer123 |

## 📊 Tính năng chính

### Dashboard
- **Overview**: Tổng quan hệ thống
- **Incidents**: Quản lý sự cố bảo mật
- **Alerts**: Cảnh báo thời gian thực
- **Analytics**: Phân tích dữ liệu
- **Reports**: Báo cáo và xuất dữ liệu

### Giám sát bảo mật
- **Log Collection**: Thu thập log từ nhiều nguồn
- **Threat Detection**: Phát hiện mối đe dọa tự động
- **Real-time Alerts**: Cảnh báo tức thì
- **Incident Response**: Quy trình xử lý sự cố

### Tích hợp
- **Email**: Gửi cảnh báo qua email
- **Slack**: Tích hợp với Slack
- **Telegram**: Bot Telegram
- **Webhook**: API webhook tùy chỉnh

## 🔧 Cấu hình nâng cao

### Cấu hình Email
Chỉnh sửa file `.env`:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Cấu hình Slack
```bash
SLACK_WEBHOOK_URL=your-slack-webhook-url
SLACK_CHANNEL=#security-alerts
```

### Cấu hình Telegram
```bash
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

## 🛠️ Quản lý hệ thống

### Lệnh hữu ích
```bash
# Xem trạng thái services
./setup.sh status

# Xem logs real-time
./setup.sh logs

# Khởi động lại services
./setup.sh restart

# Dừng hệ thống
./setup.sh stop

# Dọn dẹp tài nguyên
./setup.sh cleanup
```

### Docker commands
```bash
# Xem containers
docker-compose ps

# Xem logs của service cụ thể
docker-compose logs -f backend

# Restart service
docker-compose restart elasticsearch

# Update images
docker-compose pull && docker-compose up -d
```

## 📈 Monitoring

### Health Checks
- **Elasticsearch**: http://localhost:9200/_cluster/health
- **MongoDB**: Kiểm tra qua Docker logs
- **Backend API**: http://localhost:5000/health
- **Frontend**: http://localhost:3000

### Metrics
- **System Resources**: CPU, Memory, Disk
- **Application Metrics**: Response time, Error rate
- **Security Events**: Threat detection rate
- **Incident Metrics**: MTTR, MTTD

## 🔒 Bảo mật

### Production Deployment
1. **Thay đổi passwords mặc định**
2. **Cấu hình SSL/TLS**
3. **Bật authentication cho Elasticsearch**
4. **Cấu hình firewall**
5. **Backup dữ liệu định kỳ**

### Security Best Practices
- Sử dụng strong passwords
- Bật 2FA cho admin accounts
- Giới hạn quyền truy cập
- Monitor audit logs
- Update regularly

## 🆘 Troubleshooting

### Vấn đề thường gặp

**Elasticsearch không khởi động**
```bash
# Kiểm tra logs
docker-compose logs elasticsearch

# Tăng memory limit
# Chỉnh sửa docker-compose.yml
ES_JAVA_OPTS="-Xms1g -Xmx1g"
```

**MongoDB connection error**
```bash
# Kiểm tra MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

**Frontend không load**
```bash
# Kiểm tra backend API
curl http://localhost:5000/health

# Rebuild frontend
docker-compose build frontend
```

### Logs locations
- **Application logs**: `backend/logs/`
- **Docker logs**: `docker-compose logs`
- **System logs**: `/var/log/`

## 📞 Hỗ trợ

- **Documentation**: `/docs` folder
- **Issues**: GitHub Issues
- **Email**: support@security-dashboard.com

---

**Lưu ý**: Đây là hệ thống demo. Không sử dụng trong production mà không có đánh giá bảo mật đầy đủ.
