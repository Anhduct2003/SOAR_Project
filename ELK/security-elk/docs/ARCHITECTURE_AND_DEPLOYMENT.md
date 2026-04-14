# 🏗️ ARCHITECTURE & DEPLOYMENT GUIDE
## Security-ELK Project

> **Version:** 1.0  
> **Last Updated:** April 14, 2026  
> **Level:** Comprehensive

---

## 📋 TABLE OF CONTENTS

1. [System Architecture](#1-system-architecture)
2. [Component Details](#2-component-details)
3. [Data Flow](#3-data-flow)
4. [Security Architecture](#4-security-architecture)
5. [Deployment Guide](#5-deployment-guide)
6. [Scaling Guide](#6-scaling-guide)
7. [Monitoring & Alerting](#7-monitoring--alerting)
8. [Backup & Recovery](#8-backup--recovery)

---

## 1. System Architecture

### 1.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         EXTERNAL USERS                           │
│                    (SOC Analysts, Admins)                        │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS/WSS
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Frontend: React + Nginx (Port 3000)                      │   │
│  │  • Dashboard with real-time metrics                       │   │
│  │  • Incident management interface                          │   │
│  │  • Alert visualization                                    │   │
│  │  • User administration                                    │   │
│  │  • WebSocket for push notifications                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ REST API + WebSocket
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Backend: Node.js + Express (Port 5000)                   │   │
│  │  • JWT Authentication & Authorization                     │   │
│  │  • Incident CRUD Operations                               │   │
│  │  • Alert Webhook Handler (ElastAlert)                     │   │
│  │  • Dashboard Statistics                                   │   │
│  │  • Elasticsearch Query Proxy                              │   │
│  │  • Socket.IO Real-time Broadcasting                       │   │
│  │  • Telegram/Email Notifications                           │   │
│  │  • Rate Limiting & Input Validation                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────┬──────────────────────────────┬──────────────────────────┘
        │                              │
        ▼                              ▼
┌──────────────────┐        ┌──────────────────────────────────┐
│  DATA LAYER      │        │  ANALYTICS LAYER                 │
│                  │        │                                  │
│  ┌────────────┐  │        │  ┌────────────────────────────┐  │
│  │  MongoDB   │  │        │  │  Elasticsearch (Port 9200) │  │
│  │ (Port 27017│  │        │  │  • Log Storage             │  │
│  │            │  │        │  │  • Full-text Search        │  │
│  │ • Users    │  │        │  │  • Time-series Analytics   │  │
│  │ • Incidents│  │        │  │  • GeoIP Data              │  │
│  │ • Alerts   │  │        │  └──────────┬─────────────────┘  │
│  │ • BlockedIP│  │        │             │                     │
│  └────────────┘  │        │  ┌──────────▼─────────────────┐  │
│                  │        │  │  ElastAlert2               │  │
│                  │        │  │  • Rule Engine             │  │
│                  │        │  │  • Anomaly Detection       │  │
│                  │        │  │  • Alert Dispatch          │  │
│                  │        │  └────────────────────────────┘  │
└──────────────────┘        └──────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   LOG COLLECTION LAYER                           │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Filebeat │  │Auditbeat │  │Packetbeat│  │  Logstash      │  │
│  │ (Logs)   │  │(System)  │  │(Network) │  │  (Processing)  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬────────┘  │
│       └─────────────┼─────────────┘               │            │
│                     ▼                             ▼            │
│              ┌──────────────┐            ┌──────────────┐      │
│              │  Log Sources │            │Elasticsearch │      │
│              └──────────────┘            └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Purpose | Port |
|-------|-----------|---------|------|
| **Frontend** | React 18 + Nginx | UI Dashboard | 3000 |
| **Backend** | Node.js 18 + Express | REST API | 5000-5001 |
| **Auth** | JWT (jsonwebtoken) | Authentication | - |
| **Real-time** | Socket.IO | WebSocket | 3000/5000 |
| **Business DB** | MongoDB 6.0 | Users, Incidents | 27017 |
| **Search Engine** | Elasticsearch 8.11 | Log storage | 9200 |
| **Log Processing** | Logstash 8.11 | Parse/filter | 5044, 5000 |
| **Visualization** | Kibana 8.11 | Log explorer | 5601 |
| **Log Collection** | Filebeat 8.11 | File logs | - |
| **System Audit** | Auditbeat 8.11 | System events | - |
| **Network** | Packetbeat 8.11 | Network flows | - |
| **Alerting** | ElastAlert2 | Rule engine | - |

---

## 2. Component Details

### 2.1 Backend Architecture

```
backend/
├── server.js                 # Main entry point
│   ├── Express app setup
│   ├── Middleware stack (Helmet, CORS, Rate Limit)
│   ├── Route registration
│   ├── Socket.IO setup
│   ├── MongoDB connection
│   └── Error handling
│
├── routes/                   # API endpoints
│   ├── auth.js               # /api/auth/*
│   │   ├── POST /register    # User registration (validated)
│   │   ├── POST /login       # User login (validated)
│   │   ├── GET /me           # Get current user
│   │   ├── PUT /change-password
│   │   └── GET /users        # List users (admin only)
│   │
│   ├── incidents.js          # /api/incidents/*
│   │   ├── GET /             # List all incidents
│   │   ├── POST /            # Create incident (validated)
│   │   ├── GET /:id          # Get single incident
│   │   ├── PUT /:id          # Update incident
│   │   ├── DELETE /:id       # Delete incident
│   │   └── POST /block-ip    # Block IP address
│   │
│   ├── alerts.js             # /api/alerts/*
│   │   ├── GET /             # List alerts
│   │   └── POST /webhook     # Receive ElastAlert webhooks
│   │
│   ├── dashboard.js          # /api/dashboard/*
│   │   ├── GET /stats        # Dashboard statistics
│   │   └── GET /recent-incidents
│   │
│   └── elasticsearch.js      # /api/elasticsearch/*
│       └── GET /ping         # Test ES connection
│
├── models/                   # MongoDB schemas
│   ├── User.js               # User schema with password hashing
│   ├── Incident.js           # Incident schema with timeline
│   └── BlockedIP.js          # Blocked IP tracking
│
├── middleware/               # Express middleware
│   ├── auth.js               # JWT verification + role check
│   ├── errorHandler.js       # Global error handler
│   └── validator.js          # Joi input validation (Phase 1)
│
└── utils/
    └── logger.js             # Winston logger configuration
```

### 2.2 Frontend Architecture

```
frontend/src/
├── App.js                    # Main app with routing
│   ├── QueryClientProvider (React Query)
│   ├── ThemeProvider (Dark/Light)
│   ├── AuthProvider (JWT state)
│   ├── SocketProvider (WebSocket state)
│   └── Routes (React Router)
│
├── pages/                    # Route components
│   ├── Login.js              # Authentication page
│   ├── Dashboard.js          # Main dashboard with stats
│   ├── Incidents.js          # Incident list/create
│   ├── Alerts.js             # Alert management
│   ├── Users.js              # User administration
│   └── Settings.js           # System settings
│
├── components/               # Reusable components
│   ├── Layout.js             # Main app layout
│   └── PrivateRoute.js       # Auth guard
│
├── contexts/                 # React contexts
│   ├── AuthContext.js        # User state & login
│   ├── SocketContext.js      # WebSocket connection
│   └── ThemeContext.js       # Theme switching
│
└── utils/
    └── axiosConfig.js        # Axios defaults + interceptors
```

### 2.3 Database Schema

#### MongoDB Collections

**Users:**
```javascript
{
  _id: ObjectId,
  username: String (unique, 3-50 chars),
  email: String (unique, validated),
  password: String (bcrypt hashed),
  firstName: String,
  lastName: String,
  role: String (admin/analyst/viewer),
  department: String,
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Incidents:**
```javascript
{
  _id: ObjectId,
  title: String (5-200 chars),
  description: String,
  severity: String (low/medium/high/critical),
  status: String (open/investigating/contained/resolved/closed),
  category: String (malware/phishing/etc),
  source: String (manual/automated/external/user_report),
  affectedSystems: [String],
  affectedUsers: [String],
  ipAddresses: [String (validated)],
  location: {
    country: String,
    city: String,
    coordinates: { lat: Number, lng: Number }
  },
  detectedAt: Date,
  resolvedAt: Date,
  assignedTo: ObjectId (ref: User),
  createdBy: ObjectId (ref: User),
  updatedBy: ObjectId (ref: User),
  timeline: [{
    timestamp: Date,
    action: String,
    description: String,
    user: ObjectId (ref: User)
  }],
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 3. Data Flow

### 3.1 Authentication Flow

```
1. User enters credentials in Login page
   ↓
2. Frontend POST /api/auth/login
   ↓
3. Backend validates input (Joi)
   ↓
4. Backend finds user in MongoDB
   ↓
5. Backend verifies password (bcrypt)
   ↓
6. Backend generates JWT token
   ↓
7. Backend returns token + user info
   ↓
8. Frontend stores token in memory
   ↓
9. Frontend attaches token to all API requests
   ↓
10. Backend validates token on each request
```

### 3.2 Incident Creation Flow

```
A. Manual Creation:
   User → Frontend Form → POST /api/incidents → MongoDB → Broadcast via WebSocket

B. Automated (via ElastAlert):
   Log Event → Filebeat → Logstash → Elasticsearch → ElastAlert Rule Match
   → POST /api/alerts/webhook → MongoDB → Create Incident → Telegram Notification
   → Broadcast via WebSocket → Frontend Notification Badge
```

### 3.3 Alert Processing Flow

```
1. Security event occurs (e.g., failed login)
   ↓
2. Filebeat detects new log line
   ↓
3. Filebeat ships to Logstash
   ↓
4. Logstash parses with Grok patterns
   ↓
5. Logstash enriches with GeoIP
   ↓
6. Logstash stores in Elasticsearch
   ↓
7. ElastAlert queries Elasticsearch
   ↓
8. Rule matches threshold (e.g., 10 failed logins in 5 min)
   ↓
9. ElastAlert sends webhook to backend
   ↓
10. Backend creates incident in MongoDB
    ↓
11. Backend sends Telegram notification
    ↓
12. Backend broadcasts via WebSocket
    ↓
13. Frontend displays notification
```

---

## 4. Security Architecture

### 4.1 Defense in Depth

```
Layer 1: Network Security
├── Docker network isolation
├── Port exposure minimization
└── Trust proxy configuration

Layer 2: Transport Security
├── HTTPS (production)
├── WSS for WebSocket
└── TLS for database connections

Layer 3: Application Security
├── Helmet.js security headers
├── CORS whitelist
├── Rate limiting (per endpoint)
├── Input validation (Joi)
└── Password hashing (bcrypt)

Layer 4: Authentication Security
├── JWT tokens (strong secrets)
├── Token expiration
├── Role-based access control
└── Account lockout (future)

Layer 5: Data Security
├── MongoDB authentication
├── Elasticsearch X-Pack security (production)
├── Secrets in .env (not committed)
└── Encrypted connections (production)
```

### 4.2 CORS Configuration

**Implementation:** `backend/server.js`

```javascript
const allowedOrigins = process.env.CORS_ORIGINS
  .split(',')
  .map(origin => origin.trim());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### 4.3 Rate Limiting

| Endpoint | Window | Max Requests | Skip Success |
|----------|--------|--------------|--------------|
| `/api/*` | 15 min | 100 | No |
| `/api/auth/*` | 15 min | 10 | Yes |
| `/api/alerts/webhook` | 5 min | 50 | No |

### 4.4 Input Validation

**Password Requirements:**
```
✓ Minimum 8 characters
✓ At least 1 uppercase letter (A-Z)
✓ At least 1 lowercase letter (a-z)
✓ At least 1 number (0-9)
✓ At least 1 special character (@$!%*?&)
```

**Valid Incident Categories:**
```
malware, phishing, data_breach, ddos, insider_threat,
physical_security, network_intrusion, web_application,
social_engineering, other
```

---

## 5. Deployment Guide

### 5.1 Development Deployment

```bash
# Clone repository
git clone <repo-url>
cd security-elk

# Configure environment
cp .env.example .env
# Edit .env with your values

# Build and start
docker-compose build
docker-compose up -d

# Wait 2 minutes
sleep 120

# Verify
docker-compose ps
curl http://localhost:5001/health
```

### 5.2 Production Deployment

```bash
# 1. Generate production secrets
export JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('base64'))")
export MONGO_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 2. Create .env file
cat > .env << EOF
NODE_ENV=production
JWT_SECRET=${JWT_SECRET}
MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
MONGODB_URI=mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/security_incidents?authSource=admin
CORS_ORIGINS=https://your-domain.com
ELASTIC_PASSWORD=ChangeMe123!@#
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id
EOF

# 3. Setup SSL certificate
sudo certbot --nginx -d your-domain.com

# 4. Deploy with production overrides
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 5. Wait for health checks
watch -n 5 'docker-compose ps'

# 6. Verify
curl https://your-domain.com/health
curl https://your-domain.com/api/health
```

### 5.3 Docker Compose Production Overrides

**Key changes in `docker-compose.prod.yml`:**
- Elasticsearch X-Pack security enabled
- Password authentication for all ES users
- Kibana SSL support
- Production logging levels
- Resource limits

---

## 6. Scaling Guide

### 6.1 Vertical Scaling

| Component | Min | Recommended | Max |
|-----------|-----|-------------|-----|
| **RAM** | 4GB | 8GB | 16GB |
| **CPU** | 2 cores | 4 cores | 8 cores |
| **Storage** | 50GB | 100GB | 500GB |

### 6.2 Horizontal Scaling

**Backend:**
```yaml
# Run multiple backend instances
services:
  backend-1:
    build: ./backend
    ports:
      - "5001:5000"
  
  backend-2:
    build: ./backend
    ports:
      - "5002:5000"
```

**Add load balancer:**
```nginx
upstream backend {
    server backend-1:5000;
    server backend-2:5000;
}
```

**Elasticsearch:**
- Switch to multi-node cluster
- Add data nodes for storage scaling
- Add master nodes for high availability

---

## 7. Monitoring & Alerting

### 7.1 Health Checks

```yaml
# docker-compose.yml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:9200"]
  interval: 30s
  timeout: 10s
  retries: 5
```

### 7.2 Metrics to Monitor

| Metric | Warning | Critical |
|--------|---------|----------|
| CPU Usage | >70% | >90% |
| Memory Usage | >75% | >90% |
| Disk Usage | >70% | >85% |
| API Response Time | >1s | >5s |
| Error Rate | >1% | >5% |
| Elasticsearch Heap | >75% | >90% |

---

## 8. Backup & Recovery

### 8.1 Automated Backup Script

```bash
#!/bin/bash
BACKUP_DIR="/backup/security-elk"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Backup MongoDB
docker exec mongodb mongodump \
  --authenticationDatabase admin \
  -u admin -p ${MONGO_PASSWORD} \
  --out ${BACKUP_DIR}/mongodb_${DATE}

# Backup Elasticsearch indices
curl -X POST "localhost:9200/_snapshot/backup/snapshot_${DATE}" \
  -H 'Content-Type: application/json' \
  -d '{
    "indices": "*",
    "ignore_unavailable": true,
    "include_global_state": false
  }'

# Backup configurations
tar czf ${BACKUP_DIR}/configs_${DATE}.tar.gz \
  elk-stack/ \
  backend/Dockerfile \
  frontend/Dockerfile \
  docker-compose.yml

# Keep only last 7 days
find ${BACKUP_DIR} -mtime +7 -delete

echo "Backup completed: ${DATE}"
```

### 8.2 Recovery Procedure

```bash
# 1. Stop all services
docker-compose down

# 2. Restore MongoDB
docker-compose up -d mongodb
docker exec mongodb mongorestore \
  --authenticationDatabase admin \
  -u admin -p ${MONGO_PASSWORD} \
  /backup/mongodb_<DATE>

# 3. Restore Elasticsearch
curl -X POST "localhost:9200/_snapshot/backup/snapshot_<DATE>/_restore"

# 4. Start all services
docker-compose up -d

# 5. Verify
curl http://localhost:5001/health
```

---

## 📊 Architecture Decision Records

### ADR-001: Use MongoDB for Business Data, Elasticsearch for Logs

**Decision:** Dual database architecture

**Rationale:**
- MongoDB: Better for relational data (users, incidents with relationships)
- Elasticsearch: Optimized for time-series log data and full-text search

**Consequences:**
- More complex infrastructure
- Better performance for each use case
- Need to sync data between systems for some queries

### ADR-002: Socket.IO for Real-time Communication

**Decision:** WebSocket via Socket.IO library

**Rationale:**
- Native support for rooms/broadcasting
- Automatic reconnection
- Fallback to polling if WebSocket blocked
- Easy integration with Express

**Consequences:**
- Need to proxy WebSocket through Nginx
- Additional dependency for frontend

---

**Architecture reviewed and approved: April 14, 2026** 🏗️