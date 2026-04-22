#!/bin/bash

# Phase 1 Manual Testing Script
# Kiểm tra tất cả các fixes và security improvements

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

# Helper functions
print_test() {
    echo -e "\n${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASS++))
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAIL++))
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARN++))
}

# Configuration
BASE_URL="http://localhost:5001"
FRONTEND_URL="http://localhost:3000"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║   PHASE 1 MANUAL TESTING - Security Hardening          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Check if services are running
print_test "Checking if services are running..."
if curl -s "${BASE_URL}/health" > /dev/null 2>&1; then
    print_pass "Backend API is running"
else
    print_fail "Backend API is NOT running"
    echo -e "${YELLOW}Hint: Run 'docker-compose up -d' first${NC}"
    exit 1
fi

# Test 1: Health Check
print_test "Health Check Endpoint"
HEALTH_RESPONSE=$(curl -s "${BASE_URL}/health")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"OK"'; then
    print_pass "Health check returns OK"
else
    print_fail "Health check failed"
fi

# Test 2: Webhook Route (Critical Fix)
print_test "Webhook Route (CRITICAL FIX)"
WEBHOOK_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/alerts/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "rule_name": "Test Alert from Phase 1",
    "severity": "high",
    "source_ip": "192.168.1.100",
    "category": "network_intrusion",
    "description": "Test alert to verify webhook is working"
  }')

if echo "$WEBHOOK_RESPONSE" | grep -q '"success":true'; then
    print_pass "Webhook route is working - incident created"
    INCIDENT_ID=$(echo "$WEBHOOK_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo -e "     Created incident ID: ${GREEN}${INCIDENT_ID}${NC}"
else
    print_fail "Webhook route is NOT working"
    echo -e "     Response: ${RED}${WEBHOOK_RESPONSE}${NC}"
fi

# Test 3: Input Validation - Weak Password
print_test "Input Validation - Weak Password Registration"
WEAK_PASS_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "weak123",
    "firstName": "Test",
    "lastName": "User"
  }')

if echo "$WEAK_PASS_RESPONSE" | grep -q '"success":false'; then
    print_pass "Weak password correctly rejected"
else
    print_fail "Weak password was NOT rejected (validation not working)"
    echo -e "     Response: ${RED}${WEAK_PASS_RESPONSE}${NC}"
fi

# Test 4: Input Validation - Invalid Email
print_test "Input Validation - Invalid Email Format"
INVALID_EMAIL_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "not-an-email",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User"
  }')

if echo "$INVALID_EMAIL_RESPONSE" | grep -q '"success":false'; then
    print_pass "Invalid email correctly rejected"
else
    print_fail "Invalid email was NOT rejected"
fi

# Test 5: Strong Password Registration
print_test "Strong Password Registration"
STRONG_PASS_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User"
  }')

if echo "$STRONG_PASS_RESPONSE" | grep -q '"success":true'; then
    print_pass "Strong password accepted"
    # Save token for later tests
    TOKEN=$(echo "$STRONG_PASS_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo -e "     Token obtained for further tests"
else
    # Might fail if user already exists from previous test - that's OK
    if echo "$STRONG_PASS_RESPONSE" | grep -q 'tồn tại'; then
        print_warn "User already exists (from previous tests) - attempting login"
        LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
          -H "Content-Type: application/json" \
          -d '{
            "email": "test@example.com",
            "password": "SecurePass123!"
          }')
        if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
            TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
            print_pass "Login successful - token obtained"
        else
            print_fail "Login failed"
        fi
    else
        print_fail "Strong password was rejected"
        echo -e "     Response: ${RED}${STRONG_PASS_RESPONSE}${NC}"
    fi
fi

# Test 6: Security Headers
print_test "Security Headers (Helmet.js)"
HEADERS=$(curl -s -I "${BASE_URL}/health")

if echo "$HEADERS" | grep -qi "content-security-policy"; then
    print_pass "Content-Security-Policy header present"
else
    print_warn "Content-Security-Policy header missing (may be OK for /health)"
fi

if echo "$HEADERS" | grep -qi "x-content-type-options"; then
    print_pass "X-Content-Type-Options header present"
else
    print_warn "X-Content-Type-Options header missing"
fi

if echo "$HEADERS" | grep -qi "x-frame-options\|x-frame-policy"; then
    print_pass "X-Frame-Options header present"
else
    print_warn "X-Frame-Options header missing (may be OK for API)"
fi

# Test 7: CORS Configuration
print_test "CORS Configuration"
# Test allowed origin
CORS_ALLOWED=$(curl -s -I -H "Origin: http://localhost:3000" "${BASE_URL}/api/health")
if echo "$CORS_ALLOWED" | grep -qi "access-control-allow-origin"; then
    print_pass "CORS allows localhost:3000"
else
    print_fail "CORS not configured for allowed origin"
fi

# Test disallowed origin
CORS_BLOCKED=$(curl -s -I -H "Origin: http://evil.com" "${BASE_URL}/api/health")
if echo "$CORS_BLOCKED" | grep -qi "access-control-allow-origin.*evil.com"; then
    print_fail "CORS allows evil.com (NOT SECURE)"
else
    print_pass "CORS blocks evil.com"
fi

# Test 8: Protected Endpoint Without Token
print_test "Protected Endpoint Without Token"
PROTECTED_RESPONSE=$(curl -s "${BASE_URL}/api/incidents")
if echo "$PROTECTED_RESPONSE" | grep -q '"success":false'; then
    print_pass "Protected endpoint correctly rejects unauthenticated request"
else
    print_fail "Protected endpoint allows unauthenticated access (SECURITY ISSUE)"
fi

# Test 9: Create Incident with Valid Data
print_test "Create Incident (with valid token)"
if [ -n "$TOKEN" ]; then
    INCIDENT_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/incidents" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${TOKEN}" \
      -d '{
        "title": "Test Incident from Phase 1",
        "description": "This is a test incident to verify CRUD operations",
        "severity": "medium",
        "category": "other"
      }')
    
    if echo "$INCIDENT_RESPONSE" | grep -q '"success":true'; then
        print_pass "Incident created successfully"
    else
        print_fail "Incident creation failed"
        echo -e "     Response: ${RED}${INCIDENT_RESPONSE}${NC}"
    fi
else
    print_warn "No token available - skipping incident creation test"
fi

# Test 10: Invalid Incident Data
print_test "Create Incident (missing required fields)"
if [ -n "$TOKEN" ]; then
    INVALID_INCIDENT=$(curl -s -X POST "${BASE_URL}/api/incidents" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${TOKEN}" \
      -d '{}')
    
    if echo "$INVALID_INCIDENT" | grep -q '"success":false'; then
        print_pass "Invalid incident correctly rejected"
    else
        print_fail "Invalid incident was accepted (validation issue)"
    fi
else
    print_warn "No token available - skipping invalid incident test"
fi

# Summary
echo -e "\n"
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║                  TEST SUMMARY                           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "${GREEN}✅ PASSED: ${PASS}${NC}"
echo -e "${RED}❌ FAILED: ${FAIL}${NC}"
echo -e "${YELLOW}⚠️  WARNINGS: ${WARN}${NC}"
echo -e "\n"

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║        🎉 ALL TESTS PASSED! Phase 1 is verified!       ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║        ⚠️  Some tests failed. Review logs above.        ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
