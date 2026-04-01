# Security Incident Response API Documentation

## 🚀 **API Overview**
Base URL: `http://<SERVER_IP>:5001`
Authentication: Bearer JWT Token

---

## 🔐 **AUTHENTICATION APIs**

### **POST** `/api/auth/register` - Đăng ký user mới
```json
Request Body:
{
  "username": "analyst01",
  "email": "analyst@company.com", 
  "password": "securepass123",
  "firstName": "John",
  "lastName": "Doe",
  "department": "IT Security",
  "role": "analyst"
}

Response (201):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "60b8d8f8e1b2c1234567890a",
    "username": "analyst01",
    "email": "analyst@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "analyst",
    "department": "IT Security"
  }
}
```

### **POST** `/api/auth/login` - Đăng nhập 
```json
Request Body:
{
  "email": "admin@admin.com",
  "password": "admin123"
}

Response (200):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "60b8d8f8e1b2c1234567890a",
    "username": "admin",
    "email": "admin@admin.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin",
    "department": "IT Security"
  }
}
```

### **GET** `/api/auth/me` - Lấy thông tin user hiện tại
```bash
Headers: Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "success": true,
  "user": {
    "id": "60b8d8f8e1b2c1234567890a",
    "username": "admin",
    "email": "admin@admin.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin",
    "department": "IT Security",
    "lastLogin": "2025-09-04T08:30:00.000Z"
  }
}
```

### **PUT** `/api/auth/me` - Cập nhật thông tin user
```json
Headers: Authorization: Bearer <JWT_TOKEN>
Request Body:
{
  "firstName": "John",
  "lastName": "Smith", 
  "department": "Cyber Security"
}

Response (200):
{
  "success": true,
  "user": { ...updated user info... }
}
```

### **PUT** `/api/auth/change-password` - Đổi mật khẩu
```json
Headers: Authorization: Bearer <JWT_TOKEN>
Request Body:
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}

Response (200):
{
  "success": true,
  "message": "Password đã được thay đổi thành công"
}
```

---

## 👥 **USER MANAGEMENT APIs (Admin Only)**

### **GET** `/api/auth/users` - Lấy danh sách users
```bash
Headers: Authorization: Bearer <JWT_TOKEN>
Query Parameters:
- page: integer (default: 1)
- limit: integer (default: 10)
- role: string (admin|analyst|viewer)
- isActive: boolean

Response (200):
{
  "success": true,
  "count": 5,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  },
  "data": [
    { ...user objects... }
  ]
}
```

### **PUT** `/api/auth/users/:id` - Cập nhật user
```json
Headers: Authorization: Bearer <JWT_TOKEN>
Request Body:
{
  "role": "analyst",
  "isActive": true,
  "department": "IT Security"
}

Response (200):
{
  "success": true,
  "data": { ...updated user... }
}
```

---

## 🚨 **INCIDENTS APIs**

### **GET** `/api/incidents` - Lấy danh sách incidents
```bash
Headers: Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "60b8d8f8e1b2c1234567890a",
      "title": "Phát hiện malware trên server production",
      "description": "Phát hiện file độc hại trojan.exe...",
      "severity": "high",
      "status": "investigating", 
      "category": "malware",
      "source": "automated",
      "affectedSystems": ["web-server-01"],
      "affectedUsers": ["john.doe@company.com"],
      "ipAddresses": ["127.0.0.1"],
      "detectedAt": "2025-09-04T08:30:00.000Z",
      "createdAt": "2025-09-04T08:35:00.000Z",
      "createdBy": "60b8d8f8e1b2c1234567890b"
    }
  ]
}
```

### **POST** `/api/incidents` - Tạo incident mới
```json
Headers: Authorization: Bearer <JWT_TOKEN>
Request Body:
{
  "title": "Phát hiện malware trên server production",
  "description": "Phát hiện file độc hại trojan.exe trên server web chính",
  "severity": "high",
  "status": "open",
  "category": "malware", 
  "source": "automated",
  "affectedSystems": ["web-server-01", "database-server-02"],
  "affectedUsers": ["john.doe@company.com"],
  "ipAddresses": ["127.0.0.1", "10.0.0.5"],
  "detectedAt": "2025-09-04T08:30:00.000Z",
  "estimatedImpact": "major",
  "assignedTo": "60b8d8f8e1b2c1234567890a"
}

Response (201):
{
  "success": true,
  "data": { ...created incident... }
}
```

**Severity Levels:**
- `low` - Thấp
- `medium` - Trung bình  
- `high` - Cao
- `critical` - Nghiêm trọng

**Status Values:**
- `open` - Mở
- `investigating` - Đang điều tra
- `contained` - Đã kiểm soát
- `resolved` - Đã giải quyết
- `closed` - Đã đóng

**Categories:**
- `malware` - Phần mềm độc hại
- `phishing` - Lừa đảo
- `data_breach` - Vi phạm dữ liệu
- `ddos` - Tấn công từ chối dịch vụ
- `insider_threat` - Mối đe dọa nội bộ
- `physical_security` - An ninh vật lý
- `network_intrusion` - Xâm nhập mạng
- `web_application` - Ứng dụng web
- `social_engineering` - Kỹ thuật xã hội
- `other` - Khác

---

## 📊 **DASHBOARD APIs**

### **GET** `/api/dashboard/stats` - Thống kê tổng quan
```bash
Headers: Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "success": true,
  "data": {
    "overview": {
      "totalIncidents": 13,
      "openIncidents": 12,
      "investigatingIncidents": 1,
      "containedIncidents": 0,
      "resolvedIncidents": 0,
      "closedIncidents": 0,
      "recentIncidents": 11,
      "todayIncidents": 11,
      "avgResolutionTime": 0
    },
    "severity": {
      "low": 2,
      "medium": 6,
      "high": 3,
      "critical": 2
    },
    "categories": {
      "authentication": 1,
      "data_breach": 3,
      "malware": 2,
      "insider_threat": 1,
      "network_intrusion": 2,
      "phishing": 1
    },
    "trends": {
      "last24Hours": 11,
      "today": 11
    }
  }
}
```

### **GET** `/api/dashboard/recent-incidents` - Incidents gần đây
```bash
Headers: Authorization: Bearer <JWT_TOKEN>
Query Parameters:
- limit: integer (default: 10, max: 50)

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "Phát hiện malware trên server",
      "description": "Phát hiện file độc hại...",
      "severity": "high",
      "status": "investigating",
      "category": "malware", 
      "createdAt": "2025-09-04T08:30:00.000Z",
      "affectedSystems": ["web-server-01"],
      "createdBy": {
        "name": "John Doe",
        "email": "john.doe@company.com"
      }
    }
  ]
}
```

---

## 🔔 **ALERTS APIs**

### **GET** `/api/alerts` - Lấy danh sách alerts
```bash
Headers: Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "success": true,
  "data": []
}
```
*Note: API chưa được implement đầy đủ*

---

## 🔍 **ELASTICSEARCH APIs**

### **GET** `/api/elasticsearch/ping` - Ping Elasticsearch
```bash
Headers: Authorization: Bearer <JWT_TOKEN>

Response (200):
{
  "success": true,
  "message": "ok"
}
```

---

## 🏥 **SYSTEM APIs**

### **GET** `/health` - Health check
```bash
Response (200):
{
  "status": "OK",
  "timestamp": "2025-09-04T08:30:00.000Z",
  "uptime": 3600.5,
  "environment": "production"
}
```

---

## 🛡️ **AUTHENTICATION FLOW**

1. **Đăng nhập** → `/api/auth/login` → Nhận JWT token
2. **Attach token** → Header: `Authorization: Bearer <token>`
3. **Truy cập APIs** → Protected endpoints

## 📝 **USER ROLES & PERMISSIONS**

- **`admin`** - Full access (users, incidents, dashboard, alerts)
- **`analyst`** - Manage incidents, view dashboard
- **`viewer`** - Read-only access

---

## 🧪 **TEST CÁC API**

### Test login:
```bash
curl -X POST http://<SERVER_IP>:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"admin123"}'
```

### Test dashboard stats (sau khi có token):
```bash
curl -X GET http://<SERVER_IP>:5001/api/dashboard/stats \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Test tạo incident:
```bash
curl -X POST http://<SERVER_IP>:5001/api/incidents \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Incident",
    "description": "Incident for testing API",
    "severity": "medium",
    "category": "other"
  }'
```

---

**🔥 API Backend đã sẵn sàng với 13 incidents và full authentication system!**
