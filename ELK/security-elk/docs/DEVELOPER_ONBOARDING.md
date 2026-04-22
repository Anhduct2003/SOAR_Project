# 📘 DEVELOPER ONBOARDING GUIDE
## Security-ELK Project

> **Version:** 1.0  
> **Last Updated:** April 14, 2026  
> **Audience:** New developers joining the project

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Development Environment Setup](#4-development-environment-setup)
5. [Project Structure](#5-project-structure)
6. [Running the Application](#6-running-the-application)
7. [Development Workflow](#7-development-workflow)
8. [Security Guidelines](#8-security-guidelines)
9. [Testing](#9-testing)
10. [Common Issues & Solutions](#10-common-issues--solutions)

---

## 1. Project Overview

**Security-ELK** is a real-time Security Incident Response Dashboard that integrates:
- **ELK Stack** (Elasticsearch, Logstash, Kibana) for log management
- **Node.js/Express** backend with JWT authentication
- **React** frontend dashboard
- **MongoDB** for business data
- **ElastAlert2** for automated alerting
- **Beats** (Filebeat, Packetbeat, Auditbeat) for log collection

**Use Cases:**
- Monitor security events in real-time
- Detect attacks (bruteforce, port scan, etc.)
- Create and manage security incidents
- Automated alerts via Telegram/Email
- SOC team dashboard

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────┐
│                    User Browser                       │
│                  http://localhost:3000                │
└─────────────────────┬────────────────────────────────┘
                      │ REST API + WebSocket
                      ▼
┌──────────────────────────────────────────────────────┐
│              Frontend (React + Nginx)                 │
│  • Dashboard  • Incidents  • Alerts  • Users         │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│              Backend (Node.js + Express)              │
│  • JWT Auth  • CRUD APIs  • WebSocket  • Webhooks    │
└───────┬───────────────────────┬──────────────────────┘
        │                       │
        ▼                       ▼
┌───────────────┐       ┌───────────────────┐
│   MongoDB     │       │   Elasticsearch   │
│  Port: 27017  │       │   Port: 9200      │
│  (Business)   │       │   (Logs/Telemetry)│
└───────────────┘       └─────────┬─────────┘
                                  │
                         ┌────────▼────────┐
                         │  ElastAlert2    │
                         │  (Rule Engine)  │
                         └─────────────────┘
```

---

## 3. Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Authentication:** JWT (jsonwebtoken)
- **Database:** MongoDB (Mongoose ODM)
- **Real-time:** Socket.IO
- **Validation:** Joi
- **Logging:** Winston
- **Security:** Helmet.js, CORS, Rate Limiting

### Frontend
- **Framework:** React 18
- **Router:** React Router v6
- **State:** React Query
- **Styling:** TailwindCSS
- **UI Components:** Headless UI, Heroicons
- **Real-time:** Socket.IO Client
- **Charts:** Recharts
- **Forms:** React Hook Form

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Log Stack:** ELK (Elasticsearch, Logstash, Kibana)
- **Monitoring:** ElastAlert2, Filebeat, Packetbeat
- **Reverse Proxy:** Nginx

---

## 4. Development Environment Setup

### Prerequisites

- **Docker:** 24+ ([Install Guide](https://docs.docker.com/engine/install/))
- **Docker Compose:** v2+
- **Node.js:** 18+ (for local development)
- **Git:** 2.30+
- **RAM:** Minimum 4GB (8GB recommended)
- **Disk:** 5GB+ free space

### Step-by-Step Setup

#### Step 1: Clone Repository
```bash
git clone <repository-url>
cd security-elk
```

#### Step 2: Configure Environment Variables
```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your values
# IMPORTANT: Never commit .env to git!
```

**Required `.env` variables:**
```env
# MongoDB
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=CHANGE_ME_STRONG_PASSWORD

# JWT - Generate strong secret
JWT_SECRET=openssl rand -base64 64

# CORS - Your frontend URL
CORS_ORIGINS=http://localhost:3000

# Telegram (optional)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

**Generate strong JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

#### Step 3: Build and Start Services
```bash
# Build all Docker images
docker-compose build

# Start all services
docker-compose up -d

# Wait 1-2 minutes for services to initialize
```

#### Step 4: Verify Setup
```bash
# Check all services are running
docker-compose ps

# Expected output: All services should show "Up" status

# Test backend health
curl http://localhost:5001/health

# Test frontend
curl http://localhost:3000
```

#### Step 5: Access Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5001
- **Kibana:** http://localhost:5601
- **Elasticsearch:** http://localhost:9200

**Default Login:**
- **Email:** `admin@security.local`
- **Password:** `admin123`

---

## 5. Project Structure

```
security-elk/
├── .env.example              # Environment template (COMMIT THIS)
├── .env                      # Real secrets (NEVER COMMIT)
├── .gitignore                # Git ignore rules
├── docker-compose.yml        # Docker orchestration
├── docker-compose.prod.yml   # Production overrides
│
├── backend/                  # Node.js API Server
│   ├── Dockerfile
│   ├── server.js             # Main entry point
│   ├── package.json
│   ├── routes/               # API routes
│   │   ├── auth.js           # Authentication endpoints
│   │   ├── incidents.js      # Incident CRUD
│   │   ├── alerts.js         # Alert webhook + list
│   │   ├── dashboard.js      # Dashboard stats
│   │   └── elasticsearch.js  # ES query endpoints
│   ├── models/               # MongoDB schemas
│   │   ├── User.js
│   │   ├── Incident.js
│   │   └── BlockedIP.js
│   ├── middleware/           # Express middleware
│   │   ├── auth.js           # JWT authentication
│   │   ├── errorHandler.js   # Error handling
│   │   └── validator.js      # Joi validation
│   ├── utils/                # Utilities
│   │   └── logger.js         # Winston logger
│   ├── scripts/              # Database scripts
│   └── tests/                # Unit & integration tests
│
├── frontend/                 # React Dashboard
│   ├── Dockerfile
│   ├── nginx.conf            # Nginx configuration
│   ├── package.json
│   └── src/
│       ├── App.js            # Main app component
│       ├── components/       # Reusable components
│       ├── pages/            # Page components
│       │   ├── Dashboard.js
│       │   ├── Incidents.js
│       │   ├── Alerts.js
│       │   ├── Users.js
│       │   └── Settings.js
│       ├── contexts/         # React contexts
│       │   ├── AuthContext.js
│       │   ├── SocketContext.js
│       │   └── ThemeContext.js
│       └── utils/            # Utilities
│           └── api.js        # Axios configuration
│
├── elk-stack/                # ELK Stack Configuration
│   ├── elasticsearch/        # ES configs
│   ├── logstash/             # Logstash pipelines
│   ├── kibana/               # Kibana configs
│   ├── filebeat/             # Filebeat config
│   ├── packetbeat/           # Packetbeat config
│   └── elastalert/           # Alert rules
│       ├── config.yaml
│       └── rules/
│           ├── port_scan.yaml
│           ├── ssh_bruteforce.yaml
│           └── ...
│
├── scripts/                  # Utility scripts
│   ├── simulate_bruteforce.sh
│   ├── simulate_portscan.sh
│   └── init-mongo.js
│
├── tests/                    # Test scripts
│   ├── phase1_manual_test.sh
│   └── phase1_manual_test.bat
│
└── docs/                     # Documentation
    ├── HTTPS_CONFIGURATION.md
    └── DEVELOPER_ONBOARDING.md
```

---

## 6. Running the Application

### Start All Services
```bash
docker-compose up -d
```

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs elasticsearch

# Follow logs in real-time
docker-compose logs -f backend
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Stop Services
```bash
# Stop but keep data
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove everything (including data volumes)
docker-compose down -v
```

### Rebuild Images
```bash
# Rebuild after code changes
docker-compose build --no-cache

# Rebuild specific service
docker-compose build backend
```

### Database Operations
```bash
# Access MongoDB shell
docker exec -it mongodb mongosh -u admin -p <password>

# View incidents
docker exec -it mongodb mongosh -u admin -p <password> --eval "db.incidents.find().pretty()"

# Reset admin password
docker exec backend node scripts/reset-admin-password.js
```

---

## 7. Development Workflow

### Making Changes to Backend

1. **Edit code** in `backend/` directory
2. **Rebuild backend image:**
   ```bash
   docker-compose build backend
   docker-compose up -d backend
   ```
3. **Check logs:**
   ```bash
   docker-compose logs -f backend
   ```
4. **Test changes:**
   ```bash
   curl http://localhost:5001/api/health
   ```

### Making Changes to Frontend

1. **Edit code** in `frontend/src/` directory
2. **Rebuild frontend image:**
   ```bash
   docker-compose build frontend
   docker-compose up -d frontend
   ```
3. **Access:** http://localhost:3000

### Making Changes to ELK Stack

1. **Edit configs** in `elk-stack/` directory
2. **Restart affected services:**
   ```bash
   docker-compose restart logstash
   docker-compose restart elasticsearch
   ```

### Local Development (Without Docker)

For faster iteration, you can run backend/frontend locally:

**Backend:**
```bash
cd backend
npm install
npm run dev  # Runs with nodemon (auto-reload)
```

**Frontend:**
```bash
cd frontend
npm install
npm start    # Runs React dev server on port 3000
```

**Note:** You still need Docker for MongoDB, Elasticsearch, and other services.

---

## 8. Security Guidelines

### ✅ DO:
- **Use `.env.example`** for new environment variables
- **Generate strong secrets** (use `crypto.randomBytes`)
- **Validate all inputs** (Joi middleware handles this)
- **Use HTTPS** in production
- **Keep dependencies updated** (`npm audit fix`)
- **Review CORS whitelist** regularly
- **Use strong passwords** (8+ chars, special chars)

### ❌ DON'T:
- **NEVER commit `.env`** to git
- **NEVER hardcode secrets** in code
- **NEVER disable security headers**
- **NEVER use `*` for CORS** in production
- **NEVER skip input validation**
- **NEVER log sensitive data** (passwords, tokens)

### Adding New Environment Variables

1. Add to `.env.example` with placeholder:
   ```env
   # New Feature API Key
   NEW_FEATURE_API_KEY=CHANGE_ME
   ```

2. Add to `.env` with real value:
   ```env
   NEW_FEATURE_API_KEY=sk-1234567890abcdef
   ```

3. Access in code:
   ```javascript
   const apiKey = process.env.NEW_FEATURE_API_KEY;
   ```

---

## 9. Testing

### Run Phase 1 Manual Tests

**Linux/macOS:**
```bash
cd security-elk
bash tests/phase1_manual_test.sh
```

**Windows:**
```cmd
cd security-elk
tests\phase1_manual_test.bat
```

### Run Unit Tests (Phase 2)
```bash
cd backend
npm test
```

### Check Test Coverage
```bash
cd backend
npm test -- --coverage
```

---

## 10. Common Issues & Solutions

### Issue: Services Won't Start
```bash
# Check Docker is running
docker info

# Check ports are available
netstat -ano | findstr :3000
netstat -ano | findstr :5001
netstat -ano | findstr :27017

# Kill processes using ports
taskkill /PID <PID> /F  # Windows
kill -9 <PID>            # Linux/macOS
```

### Issue: MongoDB Connection Failed
```bash
# Check MongoDB container
docker-compose ps mongodb

# View MongoDB logs
docker-compose logs mongodb

# Restart MongoDB and backend
docker-compose restart mongodb backend
```

### Issue: Backend Can't Connect to Elasticsearch
```bash
# Check Elasticsearch is healthy
docker-compose ps elasticsearch
curl http://localhost:9200/_cluster/health

# Increase memory if ES crashes
# Edit docker-compose.yml:
# ES_JAVA_OPTS: "-Xms1g -Xmx1g"
```

### Issue: CORS Errors in Browser
1. Check `CORS_ORIGINS` in `.env` includes your frontend URL
2. Restart backend: `docker-compose restart backend`
3. Check browser console for exact error

### Issue: Webhook Not Receiving Alerts
1. Check ElastAlert logs: `docker-compose logs elastalert`
2. Test webhook manually:
   ```bash
   curl -X POST http://localhost:5001/api/alerts/webhook \
     -H "Content-Type: application/json" \
     -d '{"rule_name":"Test","severity":"high"}'
   ```
3. Check backend logs: `docker-compose logs backend`

---

## 📚 Additional Resources

- **API Documentation:** http://localhost:5001/api-docs
- **Phase 1 Completion Report:** `../PHASE_1_COMPLETION_REPORT.md`
- **Phase 2 Implementation Plan:** `../PHASE_2_IMPLEMENTATION_PLAN.md`
- **HTTPS Configuration:** `docs/HTTPS_CONFIGURATION.md`
- **Project Completion Plan:** `../PROJECT_COMPLETION_PLAN.md`

---

## 🆘 Getting Help

1. Check this guide first
2. Review logs: `docker-compose logs <service>`
3. Check documentation in `docs/` folder
4. Ask team members
5. Create issue in repository

---

**Welcome to the Security-ELK team! 🚀**