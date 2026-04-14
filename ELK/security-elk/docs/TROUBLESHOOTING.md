# 🔧 TROUBLESHOOTING GUIDE
## Security-ELK Project

> **Version:** 1.0  
> **Last Updated:** April 14, 2026  
> **Scope:** Common issues and solutions

---

## 📋 TABLE OF CONTENTS

1. [Quick Diagnostics](#1-quick-diagnostics)
2. [Docker Issues](#2-docker-issues)
3. [Backend Issues](#3-backend-issues)
4. [Frontend Issues](#4-frontend-issues)
5. [Database Issues](#5-database-issues)
6. [ELK Stack Issues](#6-elk-stack-issues)
7. [Security Issues](#7-security-issues)
8. [Performance Issues](#8-performance-issues)
9. [Recovery Procedures](#9-recovery-procedures)

---

## 1. Quick Diagnostics

### System Status Check
```bash
# Check all services
docker-compose ps

# Expected: All services should show "Up" or "Up (healthy)"
```

### Resource Check
```bash
# Check Docker resources
docker stats

# Check disk space
df -h

# Check if ports are in use
netstat -tuln | grep -E '3000|5001|9200|27017|5601'
```

### Log Check
```bash
# View recent errors from all services
docker-compose logs --tail=50 | grep -i error

# Check specific service
docker-compose logs --tail=100 backend
```

---

## 2. Docker Issues

### Issue: Docker Compose Not Found

**Symptoms:**
```
docker-compose: command not found
```

**Solution:**
```bash
# Check Docker Compose version
docker compose version

# Use new syntax
docker compose up -d  # Instead of docker-compose up -d
```

---

### Issue: Services Won't Start

**Symptoms:**
```
ERROR: for backend  Cannot start service backend
```

**Diagnostic Steps:**
```bash
# 1. Check Docker daemon
docker info

# 2. Check if ports are in use
netstat -tuln | grep 3000
netstat -tuln | grep 5001

# 3. Check for zombie containers
docker ps -a | grep security

# 4. Check Docker logs
journalctl -u docker.service | tail -n 50
```

**Solutions:**
```bash
# Solution 1: Stop and clean restart
docker-compose down
docker-compose up -d

# Solution 2: Remove containers and restart
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# Solution 3: Kill processes using ports (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Solution 4: Kill processes using ports (Linux)
lsof -ti:3000 | xargs kill -9
```

---

### Issue: Out of Memory

**Symptoms:**
- Elasticsearch container crashes
- System becomes unresponsive

**Solution:**
```bash
# 1. Check memory usage
docker stats

# 2. Increase Elasticsearch heap (edit docker-compose.yml)
# Change:
#   ES_JAVA_OPTS: "-Xms512m -Xmx512m"
# To:
#   ES_JAVA_OPTS: "-Xms256m -Xmx256m"  # Reduce if low on RAM

# 3. Reduce concurrent services
docker-compose stop kibana logstash elastalert

# 4. Restart with more memory allocation
# Docker Desktop: Settings → Resources → Memory → Increase to 8GB+
```

---

### Issue: Docker Build Fails

**Symptoms:**
```
ERROR: Service 'backend' failed to build
```

**Diagnostic:**
```bash
# Build with verbose output
docker-compose build --no-cache --progress=plain backend 2>&1 | tail -n 50
```

**Solutions:**
```bash
# Solution 1: Clear Docker cache
docker system prune -a

# Solution 2: Check Dockerfile syntax
cat backend/Dockerfile

# Solution 3: Build manually for debugging
cd backend
docker build -t security-backend .
```

---

## 3. Backend Issues

### Issue: Backend Won't Start

**Symptoms:**
- Container exits immediately
- Status shows "Exited"

**Diagnostic:**
```bash
# Check backend logs
docker-compose logs backend

# Common errors:
# - MongoDB connection failed
# - JWT_SECRET not set
# - Port already in use
```

**Solutions:**

**Error: MongoDB connection failed**
```bash
# 1. Check MongoDB is running
docker-compose ps mongodb

# 2. Test MongoDB connection
docker exec -it mongodb mongosh --eval "db.adminCommand('ping')"

# 3. Verify .env has correct MongoDB URI
cat .env | grep MONGODB_URI

# 4. Restart MongoDB and backend
docker-compose restart mongodb backend
```

**Error: JWT_SECRET not set**
```bash
# Check .env has JWT_SECRET
cat .env | grep JWT_SECRET

# If missing, add strong secret
# Generate new JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Add to .env
echo "JWT_SECRET=<generated_secret>" >> .env

# Restart backend
docker-compose restart backend
```

---

### Issue: Webhook Not Working

**Symptoms:**
- ElastAlert sends alerts but incidents not created
- POST /api/alerts/webhook returns error

**Diagnostic:**
```bash
# 1. Test webhook manually
curl -X POST http://localhost:5001/api/alerts/webhook \
  -H "Content-Type: application/json" \
  -d '{"rule_name":"Test","severity":"high"}'

# Expected: {"success":true,"id":"..."}

# 2. Check backend logs
docker-compose logs backend | grep -i webhook

# 3. Check route exists in code
grep -n "webhook" backend/routes/alerts.js
```

**Solution:**
```bash
# Phase 1 fixed this issue. If still failing:
# 1. Rebuild backend
docker-compose build backend
docker-compose up -d backend

# 2. Verify alerts.js has webhook BEFORE module.exports
cat backend/routes/alerts.js | tail -n 20
# Should see: module.exports = router; at the END
```

---

### Issue: Rate Limiting Too Strict

**Symptoms:**
```json
{
  "message": "Quá nhiều requests từ IP này"
}
```

**Solution:**
```bash
# Adjust rate limits in .env
cat .env | grep RATE_LIMIT

# Edit .env:
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=200  # Increase from 100

# Restart backend
docker-compose restart backend
```

---

### Issue: CORS Errors

**Symptoms:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
```bash
# 1. Check CORS_ORIGINS in .env
cat .env | grep CORS_ORIGINS

# 2. Add your frontend URL
echo "CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000" >> .env

# 3. Restart backend
docker-compose restart backend

# 4. Verify CORS headers
curl -I -H "Origin: http://localhost:3000" http://localhost:5001/api/health
# Should see: Access-Control-Allow-Origin: http://localhost:3000
```

---

## 4. Frontend Issues

### Issue: Frontend Shows Blank Page

**Diagnostic:**
```bash
# 1. Check frontend logs
docker-compose logs frontend

# 2. Check browser console (F12)
# Look for errors in Console tab

# 3. Verify build succeeded
docker-compose exec frontend ls -la /usr/share/nginx/html
```

**Solutions:**
```bash
# Solution 1: Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend

# Solution 2: Clear browser cache
# Ctrl+Shift+Delete (Chrome)
# Clear cache and hard reload (Ctrl+F5)

# Solution 3: Check nginx config
docker-compose exec frontend cat /etc/nginx/nginx.conf
```

---

### Issue: Can't Login

**Symptoms:**
- Login button does nothing
- "Invalid credentials" error

**Diagnostic:**
```bash
# 1. Test login API directly
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@security.local","password":"admin123"}'

# 2. Check if backend is reachable from frontend
docker-compose exec frontend curl -v http://backend:5000/health

# 3. Check browser network tab (F12 → Network)
```

**Solutions:**
```bash
# Solution 1: Reset admin password
docker exec backend node scripts/reset-admin-password.js

# Solution 2: Check .env has correct MongoDB URI
cat .env | grep MONGODB_URI

# Solution 3: Rebuild and restart
docker-compose build backend frontend
docker-compose up -d
```

---

### Issue: API Calls Fail from Frontend

**Symptoms:**
- Backend works with curl but fails from browser
- Network tab shows 502 Bad Gateway

**Solution:**
```bash
# 1. Check nginx proxy configuration
docker-compose exec frontend cat /etc/nginx/nginx.conf

# 2. Verify backend is accessible
docker-compose exec frontend curl http://backend:5000/health

# 3. Check nginx logs
docker-compose logs frontend | grep error

# 4. Restart frontend
docker-compose restart frontend
```

---

## 5. Database Issues

### Issue: MongoDB Connection Refused

**Symptoms:**
```
MongoServerError: connect ECONNREFUSED mongodb:27017
```

**Solutions:**
```bash
# 1. Check MongoDB container status
docker-compose ps mongodb

# 2. Check MongoDB logs
docker-compose logs mongodb

# 3. Test connection from host
docker exec -it mongodb mongosh --eval "db.adminCommand('ping')"

# 4. Check .env credentials match
cat .env | grep MONGO_INITDB

# 5. Reset MongoDB (CAUTION: Deletes all data)
docker-compose down -v
docker-compose up -d
```

---

### Issue: Elasticsearch Unavailable

**Symptoms:**
```
Elasticsearch ERROR: Connection refused
```

**Solutions:**
```bash
# 1. Check Elasticsearch status
curl http://localhost:9200/_cluster/health?pretty

# 2. Check ES logs
docker-compose logs elasticsearch

# 3. Increase vm.max_map_count (Linux)
sudo sysctl -w vm.max_map_count=262144

# 4. Restart Elasticsearch
docker-compose restart elasticsearch

# 5. Wait for health check (takes 1-2 minutes)
watch -n 5 'curl -s http://localhost:9200/_cluster/health?pretty'
```

---

## 6. ELK Stack Issues

### Issue: ElastAlert Not Sending Alerts

**Symptoms:**
- ElastAlert runs but no webhooks sent
- No incidents created from alerts

**Diagnostic:**
```bash
# 1. Check ElastAlert logs
docker-compose logs elastalert

# 2. Check rules are loaded
docker exec elastalert ls -la /opt/elastalert/rules

# 3. Check config
docker exec elastalert cat /opt/elastalert/config.yaml

# 4. Test webhook endpoint
curl -X POST http://localhost:5001/api/alerts/webhook \
  -H "Content-Type: application/json" \
  -d '{"test":true}'
```

**Solutions:**
```bash
# Solution 1: Restart ElastAlert
docker-compose restart elastalert

# Solution 2: Check rules syntax
docker exec elastalert elastalert-test-rule --config /opt/elastalert/config.yaml /opt/elastalert/rules/port_scan.yaml

# Solution 3: Check backend is reachable
docker exec elastalert curl -v http://backend:5000/api/alerts/webhook
```

---

### Issue: Logstash Not Processing Logs

**Diagnostic:**
```bash
# Check Logstash logs
docker-compose logs logstash

# Check pipeline configuration
docker exec logstash cat /usr/share/logstash/pipeline/logstash.conf
```

**Solutions:**
```bash
# Solution 1: Restart Logstash
docker-compose restart logstash

# Solution 2: Validate pipeline config
docker exec logstash logstash --config.test_and_exit \
  --path.settings /usr/share/logstash/config \
  -f /usr/share/logstash/pipeline/logstash.conf
```

---

## 7. Security Issues

### Issue: Secrets Exposed in Git

**Symptoms:**
- `.env` file committed to git

**Immediate Actions:**
```bash
# 1. Check if .env is tracked
git ls-files | grep .env

# 2. Remove from git (keep local file)
git rm --cached .env
echo ".env" >> .gitignore
git commit -m "Remove .env from tracking"

# 3. Rotate ALL secrets immediately
# - Generate new JWT_SECRET
# - Change MongoDB password
# - Update Telegram tokens
# - Rebuild containers
```

---

### Issue: CORS Allows All Origins

**Symptoms:**
- CORS headers show `Access-Control-Allow-Origin: *`

**Solution:**
```bash
# This was fixed in Phase 1. If still happening:

# 1. Check server.js CORS configuration
grep -A 10 "cors({" backend/server.js

# 2. Set CORS_ORIGINS in .env
echo "CORS_ORIGINS=http://localhost:3000" >> .env

# 3. Rebuild backend
docker-compose build backend
docker-compose up -d backend
```

---

## 8. Performance Issues

### Issue: Slow API Responses

**Diagnostic:**
```bash
# 1. Test response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5001/health

# 2. Check server resources
docker stats

# 3. Check MongoDB query performance
docker exec -it mongodb mongosh --eval "db.setProfilingLevel(2)"
```

**Solutions:**
```bash
# Solution 1: Increase Node.js memory
# Edit backend/Dockerfile:
# NODE_OPTIONS: "--max-old-space-size=1024"

# Solution 2: Add MongoDB indexes
docker exec -it mongodb mongosh --eval "
  db.incidents.createIndex({severity: 1, status: 1});
  db.incidents.createIndex({createdAt: -1});
"

# Solution 3: Reduce Elasticsearch heap if too large
# Edit docker-compose.yml:
# ES_JAVA_OPTS: "-Xms512m -Xmx512m"
```

---

### Issue: High CPU Usage

**Diagnostic:**
```bash
# Check which service uses CPU
docker stats --no-stream

# Check backend logs for errors
docker-compose logs backend | grep -i error | tail -n 20
```

**Solutions:**
```bash
# Solution 1: Restart high-CPU services
docker-compose restart backend elasticsearch

# Solution 2: Reduce Logstash workers
# Edit logstash config
# pipeline.workers: 1

# Solution 3: Limit ElastAlert frequency
# Edit elastalert/config.yaml
# run_every:
#   minutes: 2  # Increase from 1
```

---

## 9. Recovery Procedures

### Full System Reset

**WARNING: This deletes all data!**

```bash
# 1. Stop all services
docker-compose down

# 2. Remove all volumes (deletes data)
docker-compose down -v

# 3. Remove all images
docker-compose rm -f

# 4. Clean Docker cache
docker system prune -a

# 5. Rebuild everything
docker-compose build --no-cache

# 6. Start fresh
docker-compose up -d

# 7. Wait 2 minutes and verify
sleep 120
docker-compose ps
curl http://localhost:5001/health
```

---

### Data Backup

```bash
# Backup MongoDB
docker exec mongodb mongodump \
  --authenticationDatabase admin \
  -u admin \
  -p <password> \
  --out /data/backup
docker cp mongodb:/data/backup ./mongodb-backup

# Backup Elasticsearch data
docker cp elasticsearch:/usr/share/elasticsearch/data ./elasticsearch-backup

# Backup configurations
tar czf elk-configs-backup.tar.gz elk-stack/
```

---

### Data Restore

```bash
# Restore MongoDB
docker cp ./mongodb-backup mongodb:/data/backup
docker exec mongodb mongorestore \
  --authenticationDatabase admin \
  -u admin \
  -p <password> \
  /data/backup

# Restart services
docker-compose restart mongodb
```

---

## 📞 Emergency Contacts

### Quick Commands Reference

| Issue | Command |
|-------|---------|
| System won't start | `docker-compose down -v && docker-compose up -d` |
| Backend crash | `docker-compose logs backend` |
| Database corrupted | `docker-compose down -v && docker-compose up -d` |
| Ports in use | `netstat -tuln \| grep <PORT>` |
| Out of memory | `docker stats` |
| Reset admin password | `docker exec backend node scripts/reset-admin-password.js` |

---

## 📝 Reporting Issues

When creating bug reports, include:

```bash
# System info
docker --version
docker-compose --version
uname -a

# Service status
docker-compose ps

# Recent logs
docker-compose logs --tail=100 backend > backend-logs.txt
docker-compose logs --tail=100 frontend > frontend-logs.txt

# Configuration
cat .env | grep -v PASSWORD | grep -v SECRET | grep -v TOKEN
```

---

**Still having issues?** Check the Phase 1 completion report or create a GitHub issue! 🔧