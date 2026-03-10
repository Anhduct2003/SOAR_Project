# 🧪 CURL COMMANDS - Security Incident Response API Test

Base URL: `http://localhost:5001`

## 🔐 **1. AUTHENTICATION APIs**

### **Login để lấy JWT Token**
```bash
# Test login với admin credentials
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@security.local",
    "password": "admin123"
  }'

# Response sẽ có token như:
# {"success":true,"token":"eyJhbGci...","user":{...}}
```

### **Lưu token vào biến để dùng cho các API khác**
```bash
# Copy token từ response login và set vào biến
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YjkyNzA0OGEwNTg2N2Y0MmZhMzM1MCIsImlhdCI6MTc1Njk3NTQwOSwiZXhwIjoxNzU5NTY3NDA5fQ.EwEFwB-9vAHzaZccQCnuYQZbsBAfeeTGgvFdgsj0Cbw"

# Hoặc login và extract token trong 1 lệnh:
export TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@security.local","password":"admin123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"
```

### **Đăng ký user mới**
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "analyst01",
    "email": "analyst@company.com",
    "password": "securepass123",
    "firstName": "John",
    "lastName": "Doe",
    "department": "IT Security",
    "role": "analyst"
  }'
```

### **Lấy thông tin user hiện tại**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/auth/me
```

### **Cập nhật thông tin user**
```bash
curl -X PUT http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John Updated",
    "lastName": "Smith",
    "department": "Cyber Security Team"
  }'
```

### **Đổi mật khẩu**
```bash
curl -X PUT http://localhost:5001/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "admin123",
    "newPassword": "newpassword456"
  }'
```

---

## 👥 **2. USER MANAGEMENT APIs (Admin Only)**

### **Lấy danh sách users**
```bash
# Lấy tất cả users (page 1, limit 10)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/auth/users"

# Với pagination và filter
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/auth/users?page=1&limit=5&role=analyst&isActive=true"
```

### **Cập nhật user (cần User ID)**
```bash
# Replace USER_ID với ID thực của user
curl -X PUT http://localhost:5001/api/auth/users/USER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "analyst",
    "isActive": true,
    "department": "SOC Team"
  }'
```

---

## 🚨 **3. INCIDENTS APIs**

### **Lấy danh sách incidents**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/incidents
```

### **Tạo incident mới**
```bash
curl -X POST http://localhost:5001/api/incidents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Phát hiện malware trên server production",
    "description": "Phát hiện file độc hại trojan.exe trên server web chính, có khả năng đã bị xâm nhập từ bên ngoài",
    "severity": "high",
    "status": "open",
    "category": "malware",
    "source": "automated",
    "affectedSystems": ["web-server-01", "database-server-02"],
    "affectedUsers": ["john.doe@company.com", "jane.smith@company.com"],
    "ipAddresses": ["192.168.1.100", "10.0.0.5"],
    "detectedAt": "2025-09-04T08:30:00.000Z",
    "estimatedImpact": "major"
  }'
```

### **Các ví dụ tạo incidents khác**
```bash
# Incident phishing
curl -X POST http://localhost:5001/api/incidents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Email phishing nhắm vào nhân viên tài chính",
    "description": "Phát hiện email giả mạo CEO yêu cầu chuyển tiền khẩn cấp",
    "severity": "medium",
    "category": "phishing",
    "source": "user_report",
    "affectedUsers": ["finance@company.com"],
    "estimatedImpact": "moderate"
  }'

# Incident data breach
curl -X POST http://localhost:5001/api/incidents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nghi ngờ rò rỉ dữ liệu khách hàng",
    "description": "Phát hiện truy cập bất thường vào database khách hàng ngoài giờ làm việc",
    "severity": "critical",
    "category": "data_breach",
    "source": "automated",
    "affectedSystems": ["customer-db", "payment-gateway"],
    "ipAddresses": ["203.162.4.191"],
    "estimatedImpact": "severe"
  }'

# Incident network intrusion
curl -X POST http://localhost:5001/api/incidents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tấn công brute force vào SSH server",
    "description": "Phát hiện hơn 1000 lần thử đăng nhập SSH từ IP lạ trong 10 phút",
    "severity": "high",
    "category": "network_intrusion",
    "source": "automated",
    "affectedSystems": ["ssh-server"],
    "ipAddresses": ["185.220.101.42"],
    "estimatedImpact": "minor"
  }'
```

---

## 📊 **4. DASHBOARD APIs**

### **Lấy thống kê dashboard**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/dashboard/stats
```

### **Lấy incidents gần đây**
```bash
# Lấy 10 incidents gần nhất (default)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/dashboard/recent-incidents

# Lấy 5 incidents gần nhất
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/dashboard/recent-incidents?limit=5"
```

---

## 🔔 **5. ALERTS APIs**

### **Lấy danh sách alerts**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/alerts
```

---

## 🔍 **6. ELASTICSEARCH APIs**

### **Ping Elasticsearch**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/elasticsearch/ping
```

---

## 🏥 **7. SYSTEM APIs**

### **Health check**
```bash
curl http://localhost:5001/health
```

---

## 🧪 **8. TEST SCRIPT HOÀN CHỈNH**

### **Script test toàn bộ API**
```bash
#!/bin/bash

echo "=== SECURITY INCIDENT RESPONSE API TEST ==="
echo ""

# 1. Health check
echo "1. Testing health endpoint..."
curl -s http://localhost:5001/health | grep -q "OK" && echo "✅ Health OK" || echo "❌ Health Failed"
echo ""

# 2. Login và lấy token
echo "2. Testing login..."
RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@security.local","password":"admin123"}')

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Login successful"
    TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "Token: ${TOKEN:0:50}..."
else
    echo "❌ Login failed"
    echo "Response: $RESPONSE"
    exit 1
fi
echo ""

# 3. Test get user info
echo "3. Testing get user info..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/auth/me | grep -q '"success":true' && echo "✅ Get user info OK" || echo "❌ Get user info Failed"
echo ""

# 4. Test dashboard stats
echo "4. Testing dashboard stats..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/dashboard/stats | grep -q '"success":true' && echo "✅ Dashboard stats OK" || echo "❌ Dashboard stats Failed"
echo ""

# 5. Test get incidents
echo "5. Testing get incidents..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/incidents | grep -q '"success":true' && echo "✅ Get incidents OK" || echo "❌ Get incidents Failed"
echo ""

# 6. Test create incident
echo "6. Testing create incident..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:5001/api/incidents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Incident từ curl",
    "description": "Incident test được tạo từ script curl",
    "severity": "medium",
    "category": "other",
    "source": "manual"
  }')

if echo "$CREATE_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Create incident OK"
else
    echo "❌ Create incident Failed"
    echo "Response: $CREATE_RESPONSE"
fi
echo ""

# 7. Test alerts
echo "7. Testing alerts..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/alerts | grep -q '"success":true' && echo "✅ Alerts OK" || echo "❌ Alerts Failed"
echo ""

# 8. Test elasticsearch ping
echo "8. Testing elasticsearch ping..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/elasticsearch/ping | grep -q '"success":true' && echo "✅ Elasticsearch ping OK" || echo "❌ Elasticsearch ping Failed"
echo ""

echo "=== TEST COMPLETED ==="
```

### **Lưu script và chạy**
```bash
# Lưu script trên vào file
nano test-api.sh

# Cho quyền execute
chmod +x test-api.sh

# Chạy test
./test-api.sh
```

---

## 🎯 **9. QUICK TEST COMMANDS**

### **Test nhanh tất cả APIs chính**
```bash
# 1. Login và lưu token
export TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@security.local","password":"admin123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 2. Test các endpoints chính
echo "Health:" && curl -s http://localhost:5001/health | grep status
echo -e "\nDashboard stats:" && curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5001/api/dashboard/stats | grep totalIncidents
echo -e "\nIncidents count:" && curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5001/api/incidents | grep -o '"data":\[[^]]*\]' | grep -o '{'  | wc -l
echo -e "\nUser info:" && curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5001/api/auth/me | grep username
```

### **Test tạo multiple incidents**
```bash
# Tạo 3 incidents khác nhau
for i in {1..3}; do
  curl -s -X POST http://localhost:5001/api/incidents \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"title\": \"Test Incident #$i\",
      \"description\": \"Incident test số $i được tạo bằng script\",
      \"severity\": \"medium\",
      \"category\": \"other\",
      \"source\": \"manual\"
    }" | grep success && echo "✅ Incident #$i created"
done
```

---

## 🔥 **Tất cả API đã sẵn sàng để test!**

**Copy và chạy các lệnh curl trên để test toàn bộ hệ thống API Security Incident Response!**
