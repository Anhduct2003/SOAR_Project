# 📋 KẾ HOẠCH HOÀN THIỆN DỰ ÁN SECURITY-ELK

> **Ngày lập kế hoạch:** 14/04/2026  
> **Trạng thái hiện tại:** ~80-85% hoàn thiện (Sẵn sàng cho DEMO/TESTING)  
> **Mục tiêu:** Production-ready với AI-enhanced features  
> **Tổng thời gian ước tính:** 8-11 tuần

---

## 📊 MỤC LỤC

1. [Đánh Giá Hiện Trạng](#1-đánh-giá-hiện-trạng)
2. [Các Vấn Đề Cần Khắc Phục](#2-các-vấn-đề-cần-khắc-phục)
3. [Lộ Trình Thực Hiện](#3-lộ-trình-thực-hiện)
4. [AI Integration Strategy](#4-ai-integration-strategy)
5. [Kiểm Thử & Chất Lượng](#5-kiểm-thử--chất-lượng)
6. [Production Deployment](#6-production-deployment)
7. [Quản Lý Rủi Ro](#7-quản-lý-rủi-ro)
8. [Tiêu Chí Hoàn Thành](#8-tiêu-chí-hoàn-thành)

---

## 1. ĐÁNH GIÁ HIỆN TRẠNG

### 1.1 Tổng Quan Dự Án

**Security-ELK** là hệ thống giám sát, phát hiện, cảnh báo và phản ứng sự cố bảo mật thời gian thực, tích hợp:
- **ELK Stack:** Elasticsearch, Logstash, Kibana
- **Backend:** Node.js/Express + JWT + Socket.IO
- **Frontend:** React Dashboard
- **Database:** MongoDB (business data) + Elasticsearch (logs/telemetry)
- **Monitoring:** Filebeat, Auditbeat, Packetbeat
- **Alerting:** ElastAlert2 với 5 rules

### 1.2 Trạng Thái Các Thành Phần

| Thành Phần | Trạng Thái | Ghi Chú |
|------------|-----------|---------|
| Backend API | ✅ ~90% | Có bug ở alerts.js |
| Frontend Dashboard | ✅ ~85% | Đủ pages, cần polish UI |
| ELK Stack Config | ✅ ~85% | Cần tuning cho production |
| ElastAlert Rules | ✅ 100% | 5 rules hoạt động tốt |
| Docker Compose | ✅ ~80% | Chạy tốt, cần bảo mật |
| Documentation | ✅ ~90% | README chi tiết |
| **Tests** | ❌ 0% | Chưa có automated tests |
| **Security** | ⚠️ ~40% | CORS mở, JWT yếu, CSP tắt |

### 1.3 Điểm Mạnh

- ✅ Kiến trúc microservices rõ ràng, dễ mở rộng
- ✅ Tích hợp ELK Stack hoàn chỉnh
- ✅ Real-time notifications qua Socket.IO
- ✅ Telegram notification integration
- ✅ Documentation chi tiết, architecture diagrams
- ✅ Docker hóa, dễ deploy
- ✅ ElastAlert2 rules đa dạng (port scan, bruteforce, etc.)

### 1.4 Điểm Yếu

- ❌ Chưa có automated tests (unit, integration, E2E)
- ❌ Security configurations quá lỏng lẻo cho production
- ❌ Bug nghiêm trọng trong alerts.js (webhook không hoạt động)
- ❌ Secrets lộ trong `.env` file
- ❌ Chưa có CI/CD pipeline
- ❌ Chưa có monitoring & alerting cho system health
- ❌ Frontend chưa mobile-responsive hoàn toàn

---

## 2. CÁC VẤN ĐỀ CẦN KHẮC PHỤC

### 2.1 Bug Nghiêm Trọng (Bắt Buộc Sửa - Week 1)

| STT | File | Vấn Đề | Mức Độ | Impact | Cách Sửa |
|-----|------|--------|--------|--------|----------|
| 1 | `backend/routes/alerts.js` | Route `/webhook` đặt sau `module.exports` | 🔴 Critical | Webhook không hoạt động | Di chuyển route lên trước `module.exports` |
| 2 | `.env` | Telegram token, MongoDB password bị lộ | 🔴 Critical | Security breach | Thêm `.env` vào `.gitignore` |
| 3 | `backend/server.js` | CORS cho phép `*` (all origins) | 🟡 High | XSS, CSRF attacks | Cấu hình whitelist |
| 4 | `.env` | JWT_SECRET mặc định quá yếu | 🟡 High | Token forgery | Sinh random JWT_SECRET |
| 5 | `docker-compose.yml` | Elasticsearch security disabled | 🟡 Medium | Data exposure | Bật xpack.security |

### 2.2 Cải Tiến Bảo Mật (Week 2)

**1. CORS Configuration**
- Whitelist: `['http://localhost:3000']`
- Methods: `['GET', 'POST', 'PUT', 'DELETE']`
- Credentials: `true`

**2. Security Headers (Helmet.js)**
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
- X-XSS-Protection

**3. Rate Limiting**
- `/auth`: 10 requests/15min
- `/api`: 50 requests/15min
- IP-based throttling

**4. Input Validation**
- Joi validation tất cả endpoints
- SQL injection prevention
- XSS protection

**5. Authentication**
- Access token: 1-2 hours expiry
- Refresh token: 7-30 days
- Password complexity: 8+ chars
- Account lockout: 5 failed attempts

### 2.3 Cấu Trúc Lại Project

```
security-elk/
├── .env.example              # Template (không có secrets thật)
├── .env                      # REAL secrets (trong .gitignore)
├── .gitignore                # Thêm .env, node_modules, logs
├── docker-compose.yml
├── docker-compose.prod.yml   # Production overrides
│
├── backend/
│   ├── routes/
│   │   ├── alerts.js         # FIX: webhook route position
│   │   └── ...
│   ├── middleware/
│   │   ├── rateLimiter.js    # NEW: Strict rate limiting
│   │   └── validator.js      # NEW: Joi validation
│   ├── tests/                # NEW: Unit & integration tests
│   └── ...
│
├── ai-service/               # NEW: AI microservice
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app.py                # FastAPI
│   └── models/               # ML models
│
├── tests/                    # NEW: E2E tests
│   └── cypress/
│
└── monitoring/               # NEW: Prometheus & Grafana
    ├── prometheus.yml
    └── grafana/
```

---

## 3. LỘ TRÌNH THỰC HIỆN

### PHASE 1: BUG FIXES & SECURITY HARDENING (Tuần 1-2)

#### Week 1: Critical Bug Fixes

| Task | Thời Gian | Priority | Status |
|------|-----------|----------|--------|
| Fix alerts.js webhook route | 2h | 🔴 Critical | ⬜ Pending |
| Fix .env exposure trong git | 1h | 🔴 Critical | ⬜ Pending |
| Cấu hình CORS whitelist | 2h | 🟡 High | ⬜ Pending |
| Sinh JWT_SECRET mạnh hơn | 1h | 🟡 High | ⬜ Pending |
| Thêm input validation (Joi) | 4h | 🟡 High | ⬜ Pending |

**Deliverables:**
- ✅ Webhook hoạt động bình thường
- ✅ No secrets in git
- ✅ CORS restricted to frontend URL
- ✅ Strong JWT secret
- ✅ All inputs validated

#### Week 2: Security Hardening

| Task | Thời Gian | Priority | Status |
|------|-----------|----------|--------|
| Bật Elasticsearch X-Pack Security | 3h | 🟡 High | ⬜ Pending |
| Cấu hình HTTPS/WSS | 4h | 🟡 High | ⬜ Pending |
| Rate limiting nghiêm ngặt | 2h | 🟡 High | ⬜ Pending |
| Password policy enforcement | 2h | 🟡 High | ⬜ Pending |
| Security headers (Helmet.js) | 2h | 🟡 High | ⬜ Pending |

**Deliverables:**
- ✅ All services encrypted (TLS)
- ✅ Rate limiting active
- ✅ Password complexity required
- ✅ Security headers configured

---

### PHASE 2: TESTING & QUALITY (Tuần 3-5)

#### Week 3-4: Unit & Integration Tests

| Task | Thời Gian | Priority | Status |
|------|-----------|----------|--------|
| Setup Jest configuration | 2h | 🔴 Critical | ⬜ Pending |
| Auth routes tests | 4h | 🔴 Critical | ⬜ Pending |
| Incident CRUD tests | 6h | 🔴 Critical | ⬜ Pending |
| Alert webhook tests | 3h | 🟡 High | ⬜ Pending |
| Middleware tests | 4h | 🟡 High | ⬜ Pending |
| Model tests | 4h | 🟡 High | ⬜ Pending |

**Test Coverage Target:** 80%+

#### Week 5: E2E Tests & Load Testing

| Task | Thời Gian | Priority | Status |
|------|-----------|----------|--------|
| Setup Cypress/Playwright | 3h | 🟡 High | ⬜ Pending |
| E2E: Login/Logout flow | 4h | 🟡 High | ⬜ Pending |
| E2E: Dashboard navigation | 4h | 🟡 High | ⬜ Pending |
| E2E: Create/Edit incident | 6h | 🟡 High | ⬜ Pending |
| Load test: API (100 concurrent) | 4h | 🟢 Medium | ⬜ Pending |
| Load test: WebSocket (500 clients) | 4h | 🟢 Medium | ⬜ Pending |

---

### PHASE 3: AI INTEGRATION (Tuần 6-10)

#### Week 6-7: AI Infrastructure Setup

| Task | Thời Gian | Priority | Status |
|------|-----------|----------|--------|
| Enable Elasticsearch ML | 4h | 🟡 High | ⬜ Pending |
| Setup AI microservice (FastAPI) | 6h | 🟡 High | ⬜ Pending |
| Configure message queue (Redis) | 4h | 🟡 High | ⬜ Pending |
| Integrate AI service with backend | 6h | 🟡 High | ⬜ Pending |

**AI Service Architecture:**
```
ai-service/
├── Dockerfile
├── requirements.txt
├── app.py                    # FastAPI main app
├── models/
│   ├── alert_classifier.py   # XGBoost model
│   ├── anomaly_detector.py   # Isolation Forest
│   └── response_advisor.py   # Template-based + LLM
└── services/
    ├── prediction_service.py
    └── ml_pipeline.py
```

#### Week 8-9: ML Model Development

**1. Alert Classification Model**
- **Algorithm:** XGBoost / Random Forest
- **Features:** event_type, source_ip, time, frequency, historical_fp_rate
- **Output:** Severity (low/medium/high/critical/false_positive)
- **Target Accuracy:** 90%+ precision, 85%+ recall

**2. Anomaly Detection**
- **Algorithm:** Isolation Forest / Elasticsearch ML
- **Metrics:** network_connections, failed_logins, api_request_rate
- **Output:** Anomaly score (0-1), description
- **Target:** <5% false positive rate

**3. Response Suggestion Engine**
- **Approach:** Hybrid (Templates + LLM)
- **LLM:** GPT-4o-mini for contextual suggestions
- **Cache:** Redis, 24h TTL

#### Week 10: Frontend Integration

| Task | Thời Gian | Priority | Status |
|------|-----------|----------|--------|
| AI-powered alert prioritization UI | 6h | 🟡 High | ⬜ Pending |
| Incident response suggestions panel | 8h | 🟡 High | ⬜ Pending |
| Anomaly detection dashboard | 8h | 🟡 High | ⬜ Pending |
| Confidence scores display | 4h | 🟢 Medium | ⬜ Pending |

---

### PHASE 4: POLISH & PRODUCTION (Tuần 11-12)

#### Week 11: UI/UX Improvements

| Task | Thời Gian | Priority | Status |
|------|-----------|----------|--------|
| Dashboard redesign | 6h | 🟡 High | ⬜ Pending |
| Mobile responsiveness | 8h | 🟡 High | ⬜ Pending |
| Dark/Light theme toggle | 4h | 🟢 Medium | ⬜ Pending |
| Performance optimization | 4h | 🟡 High | ⬜ Pending |

#### Week 12: Production Deployment

| Task | Thời Gian | Priority | Status |
|------|-----------|----------|--------|
| CI/CD pipeline (GitHub Actions) | 6h | 🔴 Critical | ⬜ Pending |
| Docker image optimization | 3h | 🟡 High | ⬜ Pending |
| Monitoring (Prometheus + Grafana) | 8h | 🟡 High | ⬜ Pending |
| Backup & recovery scripts | 4h | 🟡 High | ⬜ Pending |
| Security audit (final) | 4h | 🔴 Critical | ⬜ Pending |

---

## 4. AI INTEGRATION STRATEGY

### 4.1 Tại Sao Nên Tích Hợp AI?

| Lý Do | Giá Trị | Ví Dụ |
|-------|---------|-------|
| Giảm false positives | Tiết kiệm 60% thời gian | AI lọc 100 alerts → 40 alerts thật |
| Phát hiện sớm threats | Giảm MTTR | Phát hiện DDoS trước khi gây outage |
| Tự động hóa response | Giảm workload SOC team | Auto-block IP sau khi AI xác nhận |
| Học từ lịch sử | Cải thiện theo thời gian | Model chính xác hơn sau mỗi incident |

### 4.2 3 AI Features Ưu Tiên Cao Nhất

#### Feature #1: Smart Alert Prioritization ⭐⭐⭐⭐⭐

**Mô tả:**
- ML model phân tích alerts từ ElastAlert
- Tự động phân loại: Critical / High / Medium / Low / False Positive
- Học từ lịch sử incidents để cải thiện

**Tech Stack:**
- Algorithm: XGBoost / Random Forest
- Deployment: Python microservice (FastAPI)
- Cache: Redis (24h TTL)

**Expected ROI:**
- Giảm 60% false positives
- Tăng 3x tốc độ triage

#### Feature #2: Anomaly Detection ⭐⭐⭐⭐⭐

**Mô tả:**
- Học baseline behavior của hệ thống
- Phát hiện deviations: traffic spike, login patterns
- Tự động tạo alerts khi phát hiện anomalies

**Tech Stack:**
- Algorithm: Isolation Forest / Elasticsearch ML (built-in)
- Deployment: Elasticsearch ML jobs + Python microservice

**Expected ROI:**
- Phát hiện unknown threats
- Early warning cho DDoS, data exfiltration

#### Feature #3: Automated Response Suggestions ⭐⭐⭐⭐

**Mô tả:**
- Khi incident được tạo, AI gợi ý:
  - Containment steps (block IP, disable user)
  - Investigation checklist
  - Remediation steps
  - Similar incidents từ quá khứ

**Tech Stack:**
- Approach: Hybrid (Templates + LLM)
- LLM: GPT-4o-mini (cost-effective)
- Cache: Redis (48h TTL)

**Expected ROI:**
- Giảm 50% thời gian response
- Chuẩn hóa quy trình xử lý

### 4.3 Chi Phí AI Integration

| Phương Án | Chi Phí | Thời Gian | Khuyến Nghị |
|-----------|---------|-----------|-------------|
| Elasticsearch ML | Miễn phí | 1-2 tuần | ✅ Anomaly detection |
| OpenAI API | ~$50-200/tháng | 1 tuần | ✅ Response suggestions |
| Self-hosted ML | Server costs | 3-4 tuần | ✅ Alert classification |
| **Hybrid** | **~$20-50/tháng** | **2-3 tuần** | 🎯 **Recommended** |

---

## 5. KIỂM THỬ & CHẤT LƯỢNG

### 5.1 Test Coverage Targets

| Component | Target | Tools | Status |
|-----------|--------|-------|--------|
| Backend Unit Tests | 80%+ | Jest | ⬜ 0% |
| Backend Integration Tests | 90%+ | Jest + Supertest | ⬜ 0% |
| Frontend Component Tests | 70%+ | React Testing Library | ⬜ 0% |
| E2E Tests | 100% | Cypress/Playwright | ⬜ 0% |
| Load Tests | Documented | Artillery/K6 | ⬜ 0% |

### 5.2 Test Example

```javascript
// backend/tests/unit/routes/auth.test.js
describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Test1234!' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
```

---

## 6. PRODUCTION DEPLOYMENT

### 6.1 Infrastructure Requirements

| Resource | Specification | Cost Estimate |
|----------|---------------|---------------|
| CPU | 8+ cores | $100-200/month |
| RAM | 16GB+ (32GB recommended) | $50-100/month |
| Storage | 100GB+ SSD | $20-50/month |
| **Total** | | **$170-350/month** |

### 6.2 Deployment Checklist

```
PRE-DEPLOYMENT:
☐ All tests passing
☐ Security audit completed
☐ Load tests passed
☐ .env file secured
☐ SSL certificates obtained

DEPLOYMENT:
☐ Docker Compose started
☐ Health checks passing
☐ Monitoring active
☐ Alerts configured

POST-DEPLOYMENT:
☐ Smoke tests passed
☐ Logs reviewed
☐ Performance metrics OK
```

---

## 7. QUẢN LÝ RỦI RO

### 7.1 Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Elasticsearch memory issues | Medium | High | Limit heap, monitor |
| AI model inaccurate | Medium | Medium | Human review, retrain |
| Security breach | Low | Critical | Regular audits |
| Timeline overrun | Medium | Medium | Buffer time, prioritize |

### 7.2 Contingency Plans

**Scenario 1: Elasticsearch crashes**
```
1. Restart: docker-compose restart elasticsearch
2. Increase RAM or reduce heap size
3. Monitor: docker stats elasticsearch
```

**Scenario 2: AI service unavailable**
```
1. Fallback to rule-based detection
2. Restart: docker-compose restart ai-service
3. Verify model files exist
```

---

## 8. TIÊU CHÍ HOÀN THÀNH

### 8.1 Phase Completion Criteria

| Phase | Must Have | Nice to Have |
|-------|-----------|--------------|
| **Phase 1** | All critical bugs fixed | CSP fully configured |
| **Phase 2** | 80%+ coverage, E2E passing | Load tests documented |
| **Phase 3** | 3 AI features working | Model retraining automated |
| **Phase 4** | CI/CD operational | Zero-downtime deploy |

### 8.2 Final Acceptance Criteria

**✅ Dự án hoàn thành khi:**

- [ ] Tất cả critical/high bugs fixed
- [ ] 80%+ code coverage
- [ ] AI features hoạt động (90%+ precision)
- [ ] CI/CD pipeline operational
- [ ] Monitoring & alerting active
- [ ] Security audit passed (0 critical/high)
- [ ] Documentation complete
- [ ] Load tests passed (100 concurrent users)
- [ ] Backup & recovery tested

### 8.3 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Code Coverage | 80%+ | 0% |
| Bug Count (Critical) | 0 | 2 |
| API Response Time (P95) | <500ms | TBD |
| False Positive Rate | <5% | TBD |
| Uptime | 99.9% | TBD |
| Security Vulnerabilities | 0 critical/high | TBD |

---

## 📅 TIMELINE TỔNG QUAN

```
Week 1-2:  [████████] Phase 1: Bug Fixes & Security
Week 3-5:           [████████████] Phase 2: Testing
Week 6-10:                        [████████████████████] Phase 3: AI
Week 11-12:                                           [████████] Phase 4: Production

Total: 12 weeks (~3 months)
```

---

**🚀 Let's build something amazing! Thời gian bắt đầu: Ngay bây giờ!**