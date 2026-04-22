@echo off
REM Phase 1 Manual Testing Script - Windows Version
REM Kiem tra tat ca cac fixes va security improvements

setlocal enabledelayedexpansion

set PASS=0
set FAIL=0
set WARN=0

REM Configuration
set BASE_URL=http://localhost:5001
set FRONTEND_URL=http://localhost:3000

echo.
echo ================================================
echo   PHASE 1 MANUAL TESTING - Security Hardening
echo ================================================
echo.

REM Check if services are running
echo [TEST] Checking if services are running...
curl -s "%BASE_URL%/health" >nul 2>&1
if %errorlevel% neq 0 (
    echo [FAIL] Backend API is NOT running
    echo Hint: Run 'docker-compose up -d' first
    pause
    exit /b 1
)
echo [PASS] Backend API is running
set /a PASS+=1

REM Test 1: Health Check
echo.
echo [TEST] Health Check Endpoint
curl -s "%BASE_URL%/health" | findstr /C:"OK" >nul
if %errorlevel% equ 0 (
    echo [PASS] Health check returns OK
    set /a PASS+=1
) else (
    echo [FAIL] Health check failed
    set /a FAIL+=1
)

REM Test 2: Webhook Route (Critical Fix)
echo.
echo [TEST] Webhook Route (CRITICAL FIX)
curl -s -X POST "%BASE_URL%/api/alerts/webhook" -H "Content-Type: application/json" -d "{\"rule_name\":\"Test Alert\",\"severity\":\"high\",\"source_ip\":\"192.168.1.100\"}" > webhook_response.json
findstr /C:"success" webhook_response.json >nul
if %errorlevel% equ 0 (
    echo [PASS] Webhook route is working
    set /a PASS+=1
    type webhook_response.json
) else (
    echo [FAIL] Webhook route is NOT working
    set /a FAIL+=1
    type webhook_response.json
)

REM Test 3: Input Validation - Weak Password
echo.
echo [TEST] Input Validation - Weak Password Registration
curl -s -X POST "%BASE_URL%/api/auth/register" -H "Content-Type: application/json" -d "{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"weak123\",\"firstName\":\"Test\",\"lastName\":\"User\"}" > weak_pass_response.json
findstr /C:"success" weak_pass_response.json | findstr /V "true" >nul
if %errorlevel% equ 0 (
    echo [PASS] Weak password correctly rejected
    set /a PASS+=1
) else (
    echo [FAIL] Weak password was NOT rejected
    set /a FAIL+=1
    type weak_pass_response.json
)

REM Test 4: Security Headers
echo.
echo [TEST] Security Headers (Helmet.js)
curl -s -I "%BASE_URL%/health" > headers.txt
findstr /I "content-security-policy" headers.txt >nul
if %errorlevel% equ 0 (
    echo [PASS] Content-Security-Policy header present
    set /a PASS+=1
) else (
    echo [WARN] Content-Security-Policy header missing
    set /a WARN+=1
)

REM Test 5: CORS Configuration
echo.
echo [TEST] CORS Configuration - Allowed Origin
curl -s -I -H "Origin: http://localhost:3000" "%BASE_URL%/api/health" > cors_allowed.txt
findstr /I "access-control-allow-origin" cors_allowed.txt >nul
if %errorlevel% equ 0 (
    echo [PASS] CORS allows localhost:3000
    set /a PASS+=1
) else (
    echo [FAIL] CORS not configured for allowed origin
    set /a FAIL+=1
)

echo.
echo [TEST] CORS Configuration - Blocked Origin
curl -s -I -H "Origin: http://evil.com" "%BASE_URL%/api/health" > cors_blocked.txt
findstr /I "evil.com" cors_blocked.txt >nul
if %errorlevel% neq 0 (
    echo [PASS] CORS blocks evil.com
    set /a PASS+=1
) else (
    echo [FAIL] CORS allows evil.com (NOT SECURE)
    set /a FAIL+=1
)

REM Test 6: Protected Endpoint Without Token
echo.
echo [TEST] Protected Endpoint Without Token
curl -s "%BASE_URL%/api/incidents" > protected_response.json
findstr /C:"success" protected_response.json | findstr /V "true" >nul
if %errorlevel% equ 0 (
    echo [PASS] Protected endpoint rejects unauthenticated request
    set /a PASS+=1
) else (
    echo [FAIL] Protected endpoint allows unauthenticated access
    set /a FAIL+=1
)

REM Summary
echo.
echo.
echo ================================================
echo                  TEST SUMMARY
echo ================================================
echo.
echo PASSED: %PASS%
echo FAILED: %FAIL%
echo WARNINGS: %WARN%
echo.

if %FAIL% equ 0 (
    echo ================================================
    echo    ALL TESTS PASSED! Phase 1 is verified!
    echo ================================================
) else (
    echo ================================================
    echo    Some tests failed. Review logs above.
    echo ================================================
)

REM Cleanup temporary files
del /q webhook_response.json weak_pass_response.json headers.txt cors_allowed.txt cors_blocked.txt protected_response.json >nul 2>&1

pause
