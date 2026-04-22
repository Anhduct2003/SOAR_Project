# HTTPS/WSS Configuration Guide

## Overview
This guide explains how to enable HTTPS for the Security-ELK dashboard and WSS for WebSocket connections.

## Option 1: Let's Encrypt (Recommended for Production)

### Step 1: Install Certbot
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

### Step 2: Obtain SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com
```

### Step 3: Configure Nginx for HTTPS
Update `frontend/nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Frontend
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy
    location /socket.io {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### Step 4: Auto-renew Certificate
```bash
# Add to crontab
0 3 * * * certbot renew --quiet
```

## Option 2: Self-Signed Certificates (For Testing)

### Step 1: Generate Self-Signed Certificate
```bash
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/server.key \
  -out ssl/server.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### Step 2: Update Nginx Config
```nginx
server {
    listen 443 ssl;
    server_name localhost;

    ssl_certificate /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ... rest of config
}
```

### Step 3: Mount SSL Certificates in Docker
Update `docker-compose.yml`:

```yaml
frontend:
  volumes:
    - ./frontend/nginx.conf:/etc/nginx/nginx.conf
    - ./ssl:/etc/nginx/ssl
```

## Option 3: Reverse Proxy with Traefik (Advanced)

For more complex deployments, consider using Traefik as a reverse proxy with automatic SSL certificate management.

## Backend Configuration

Update `.env` for production:
```env
# Enable trust proxy for HTTPS
NODE_ENV=production

# Update CORS origins
CORS_ORIGINS=https://your-domain.com

# WebSocket secure
WS_SECURE=true
```

## Testing HTTPS

### Test Frontend
```bash
curl -I https://your-domain.com
```

### Test Backend API
```bash
curl -X GET https://your-domain.com/api/health
```

### Test WebSocket
```javascript
const socket = io('https://your-domain.com', {
  transports: ['websocket'],
  secure: true
});
```

## Security Best Practices

1. **Use TLS 1.2 or 1.3 only**
2. **Disable weak ciphers**
3. **Enable HSTS** (already configured in Helmet.js)
4. **Redirect HTTP to HTTPS**
5. **Use OCSP stapling**
6. **Implement Certificate Transparency**
7. **Monitor certificate expiry**

## Troubleshooting

### Issue: Certificate Expired
```bash
sudo certbot renew --force-renewal
```

### Issue: Mixed Content Errors
- Ensure all resources loaded over HTTPS
- Check API calls use https://
- Verify WebSocket uses wss://

### Issue: CORS Errors After HTTPS
- Update CORS_ORIGINS in .env to include https:// URLs
- Ensure credentials: true in CORS config
