# 🧪 API TESTING GUIDE
## Security-ELK Backend

> **Version:** 1.0  
> **Last Updated:** April 14, 2026  
> **Base URL:** http://localhost:5001

---

## 📋 TABLE OF CONTENTS

1. [Setup](#1-setup)
2. [Authentication APIs](#2-authentication-apis)
3. [Incident APIs](#3-incident-apis)
4. [Alert APIs](#4-alert-apis)
5. [Dashboard APIs](#5-dashboard-apis)
6. [Health APIs](#6-health-apis)
7. [Error Handling](#7-error-handling)
8. [Testing Checklist](#8-testing-checklist)

---

## 1. Setup

### Tools Needed
- **cURL** (command-line)
- **Postman** (GUI - optional)
- **jq** (JSON parser - optional): `sudo apt install jq`

### Base Configuration
```bash
export BASE_URL=http://localhost:5001
export EMAIL=admin@security.local
export PASSWORD=admin123
```

---

## 2. Authentication APIs

### 2.1 Register New User

**Endpoint:** `POST /api/auth/register`

**Validation Rules:**
- Username: 3-50 chars, alphanumeric
- Email: Valid format
- Password: 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
- First/Last name: Required

#### ✅ Success Example
```bash
curl -X POST ${BASE_URL}/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "analyst01",
    "email": "analyst@company.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "department": "IT Security",
    "role": "analyst"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "68b927048a05867f42fa3350",
    "username": "analyst01",
    "email": "analyst@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "analyst",
    "department": "IT Security"
  }
}
```

#### ❌ Weak Password (Should Fail)
```bash
curl -X POST ${BASE_URL}/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@test.com",
    "password": "weak123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "errors": [
    "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt"
  ]
}
```

#### ❌ Invalid Email (Should Fail)
```bash
curl -X POST ${BASE_URL}/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "not-an-email",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "errors": ["Email không hợp lệ"]
}
```

---

### 2.2 Login

**Endpoint:** `POST /api/auth/login`

#### ✅ Success Example
```bash
curl -X POST ${BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@security.local",
    "password": "admin123"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "username": "admin",
    "email": "admin@security.local",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin",
    "department": "IT Security"
  }
}
```

**Save token for later use:**
```bash
export TOKEN=$(curl -s -X POST ${BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@security.local","password":"admin123"}' \
  | jq -r '.token')
```

#### ❌ Invalid Password (Should Fail)
```bash
curl -X POST ${BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@security.local",
    "password": "wrongpassword"
  }'
```

**Expected Response (401):**
```json
{
  "success": false,
  "message": "Thông tin đăng nhập không hợp lệ"
}
```

---

### 2.3 Get Current User

**Endpoint:** `GET /api/auth/me`

**Authentication:** Required (Bearer Token)

```bash
curl -X GET ${BASE_URL}/api/auth/me \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "username": "admin",
    "email": "admin@security.local",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin",
    "department": "IT Security",
    "lastLogin": "2026-04-14T10:30:00.000Z"
  }
}
```

---

### 2.4 Change Password

**Endpoint:** `PUT /api/auth/change-password`

**Authentication:** Required

```bash
curl -X PUT ${BASE_URL}/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "currentPassword": "admin123",
    "newPassword": "NewSecurePass456!"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Password đã được thay đổi thành công"
}
```

---

## 3. Incident APIs

### 3.1 Get All Incidents

**Endpoint:** `GET /api/incidents`

**Authentication:** Required

```bash
curl -X GET ${BASE_URL}/api/incidents \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "...",
      "title": "Phát hiện malware trên server",
      "severity": "high",
      "status": "investigating",
      "category": "malware",
      "createdAt": "2026-04-14T08:30:00.000Z"
    }
  ]
}
```

---

### 3.2 Create Incident

**Endpoint:** `POST /api/incidents`

**Authentication:** Required

**Validation Rules:**
- Title: 5-200 chars
- Description: 10-5000 chars
- Severity: low/medium/high/critical
- Category: One of valid categories

#### ✅ Success Example
```bash
curl -X POST ${BASE_URL}/api/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "title": "Test Incident from API Guide",
    "description": "This is a test incident to verify API is working correctly",
    "severity": "medium",
    "category": "other",
    "affectedSystems": ["web-server-01"],
    "ipAddresses": ["192.168.1.100"]
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "Test Incident from API Guide",
    "severity": "medium",
    "status": "open",
    "category": "other"
  }
}
```

#### ❌ Missing Title (Should Fail)
```bash
curl -X POST ${BASE_URL}/api/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "description": "No title provided",
    "severity": "medium",
    "category": "other"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "errors": ["Tiêu đề là bắt buộc"]
}
```

---

### 3.3 Update Incident Status

**Endpoint:** `PUT /api/incidents/:id`

**Authentication:** Required

```bash
curl -X PUT ${BASE_URL}/api/incidents/<INCIDENT_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "status": "investigating"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "status": "investigating",
    "timeline": [
      {
        "action": "status_changed",
        "description": "Trạng thái thay đổi thành: investigating"
      }
    ]
  }
}
```

---

## 4. Alert APIs

### 4.1 Get Alerts

**Endpoint:** `GET /api/alerts`

**Authentication:** Required

```bash
curl -X GET ${BASE_URL}/api/alerts?severity=high,critical&limit=20 \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "type": "incident",
      "title": "SSH Bruteforce Detected",
      "severity": "high",
      "status": "open",
      "createdAt": "2026-04-14T09:15:00.000Z"
    }
  ]
}
```

---

### 4.2 Webhook (ElastAlert)

**Endpoint:** `POST /api/alerts/webhook`

**Authentication:** None (internal only, rate limited)

```bash
curl -X POST ${BASE_URL}/api/alerts/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "rule_name": "SSH Bruteforce Detected",
    "severity": "high",
    "category": "network_intrusion",
    "source_ip": "192.168.1.100",
    "description": "Multiple failed SSH attempts detected",
    "ipAddresses": ["192.168.1.100", "10.0.0.50"]
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "id": "..."
}
```

**What happens:**
1. Creates new incident in MongoDB
2. Broadcasts to dashboard via Socket.IO
3. Sends Telegram notification (if configured)

---

## 5. Dashboard APIs

### 5.1 Get Stats

**Endpoint:** `GET /api/dashboard/stats`

**Authentication:** Required

```bash
curl -X GET ${BASE_URL}/api/dashboard/stats \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalIncidents": 13,
      "openIncidents": 12,
      "investigatingIncidents": 1,
      "recentIncidents": 11
    },
    "severity": {
      "low": 2,
      "medium": 6,
      "high": 3,
      "critical": 2
    },
    "categories": {
      "malware": 2,
      "network_intrusion": 2,
      "other": 1
    }
  }
}
```

---

### 5.2 Get Recent Incidents

**Endpoint:** `GET /api/dashboard/recent-incidents`

**Authentication:** Required

```bash
curl -X GET ${BASE_URL}/api/dashboard/recent-incidents?limit=10 \
  -H "Authorization: Bearer ${TOKEN}"
```

---

## 6. Health APIs

### 6.1 Health Check

**Endpoint:** `GET /health`

**Authentication:** None

```bash
curl -X GET ${BASE_URL}/health
```

**Expected Response (200):**
```json
{
  "status": "OK",
  "timestamp": "2026-04-14T10:30:00.000Z",
  "uptime": 3600.5,
  "environment": "production"
}
```

---

## 7. Error Handling

### Common Error Responses

#### 400 Bad Request (Validation Error)
```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "errors": [
    "Tiêu đề phải có ít nhất 5 ký tự",
    "Mật khẩu không hợp lệ"
  ]
}
```

#### 401 Unauthorized (Invalid Token)
```json
{
  "success": false,
  "message": "Token không hợp lệ hoặc đã hết hạn"
}
```

#### 403 Forbidden (Insufficient Permissions)
```json
{
  "success": false,
  "message": "Bạn không có quyền thực hiện hành động này"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "API endpoint không tồn tại"
}
```

#### 429 Too Many Requests (Rate Limited)
```json
{
  "success": false,
  "message": "Quá nhiều requests từ IP này, vui lòng thử lại sau 15 phút."
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Lỗi server nội bộ",
  "error": "Detailed error message"
}
```

---

## 8. Testing Checklist

### Authentication Tests

- [ ] Register with strong password (201)
- [ ] Register with weak password (400)
- [ ] Register with invalid email (400)
- [ ] Register duplicate email (400)
- [ ] Login with correct credentials (200)
- [ ] Login with wrong password (401)
- [ ] Login with non-existent email (401)
- [ ] Get current user with valid token (200)
- [ ] Get current user without token (401)
- [ ] Change password successfully (200)

### Incident Tests

- [ ] Get all incidents (200)
- [ ] Create incident with valid data (201)
- [ ] Create incident without title (400)
- [ ] Create incident without token (401)
- [ ] Update incident status (200)
- [ ] Get incident by ID (200)

### Alert Tests

- [ ] Get alerts (200)
- [ ] Webhook creates incident (200)
- [ ] Webhook with empty payload (200)

### Dashboard Tests

- [ ] Get stats (200)
- [ ] Get recent incidents (200)

### Security Tests

- [ ] Protected endpoint without token (401)
- [ ] Invalid token (401)
- [ ] Rate limiting triggers (429)
- [ ] CORS blocks disallowed origin
- [ ] Security headers present

---

## 📝 Quick Test Script

Run this one-liner to test the critical webhook fix:

```bash
echo "Testing webhook..." && \
curl -s -X POST http://localhost:5001/api/alerts/webhook \
  -H "Content-Type: application/json" \
  -d '{"rule_name":"Quick Test","severity":"high"}' | \
  jq '.' && \
echo "✅ Webhook is working!" || echo "❌ Webhook failed!"
```

---

**Happy Testing! 🧪**