# PowerShell Script để tấn công từ Windows Host
# Lưu file này với tên attack_from_windows.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$TargetIP,
    
    [Parameter(Mandatory=$false)]
    [int]$Port = 5001
)

Write-Host "🎯 Bắt đầu tấn công từ Windows Host đến Ubuntu VM: $TargetIP" -ForegroundColor Red
Write-Host "================================================================" -ForegroundColor Yellow

# 1. Brute Force Attack
Write-Host "`n🔐 Mô phỏng Brute Force Attack..." -ForegroundColor Cyan
$passwords = @("password123", "admin123", "123456", "qwerty", "letmein", "welcome", "password", "admin")
$emails = @("admin@example.com", "administrator@security.local", "root@local", "admin@security.local")

for ($i = 1; $i -le 15; $i++) {
    $email = $emails | Get-Random
    $password = $passwords | Get-Random
    
    Write-Host "Thử đăng nhập lần $i với $email:$password" -ForegroundColor Yellow
    
    try {
        $body = @{
            email = $email
            password = $password
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri "http://$TargetIP`:$Port/api/auth/login" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 5
    } catch {
        # Expected - wrong credentials
    }
    
    Start-Sleep -Seconds 1
}

# 2. Port Scanning
Write-Host "`n🔍 Mô phỏng Port Scanning..." -ForegroundColor Cyan
$commonPorts = @(22, 80, 443, 3000, 3306, 5001, 5432, 8080, 9000, 9200, 9300, 27017)

foreach ($port in $commonPorts) {
    Write-Host "Kiểm tra cổng $port" -ForegroundColor Yellow
    
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect($TargetIP, $port)
        Write-Host "✅ Cổng $port mở" -ForegroundColor Green
        $tcpClient.Close()
    } catch {
        Write-Host "❌ Cổng $port đóng" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 500
}

# 3. Rapid Port Scan
Write-Host "`n⚡ Quét nhanh cổng 1-100..." -ForegroundColor Cyan
for ($port = 1; $port -le 100; $port++) {
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect($TargetIP, $port)
        Write-Host "Cổng $port mở" -ForegroundColor Green
        $tcpClient.Close()
    } catch {
        # Port closed
    }
    
    if ($port % 20 -eq 0) {
        Write-Host "Đã quét đến cổng $port..." -ForegroundColor Yellow
    }
    
    Start-Sleep -Milliseconds 100
}

# 4. HTTP Flood Attack
Write-Host "`n🌊 Mô phỏng HTTP Flood..." -ForegroundColor Cyan
for ($i = 1; $i -le 20; $i++) {
    Write-Host "HTTP request $i" -ForegroundColor Yellow
    
    try {
        # Attack frontend
        Invoke-WebRequest -Uri "http://$TargetIP`:3000/" -TimeoutSec 2 -UseBasicParsing | Out-Null
    } catch {
        # Expected timeout
    }
    
    try {
        # Attack backend health endpoint
        Invoke-WebRequest -Uri "http://$TargetIP`:$Port/health" -TimeoutSec 2 -UseBasicParsing | Out-Null
    } catch {
        # Expected timeout
    }
    
    Start-Sleep -Milliseconds 200
}

# 5. Multiple Concurrent Connections
Write-Host "`n🔗 Mô phỏng Multiple Concurrent Connections..." -ForegroundColor Cyan
$jobs = @()

for ($i = 1; $i -le 10; $i++) {
    $job = Start-Job -ScriptBlock {
        param($ip, $port)
        try {
            $tcpClient = New-Object System.Net.Sockets.TcpClient
            $tcpClient.Connect($ip, $port)
            Start-Sleep -Seconds 2
            $tcpClient.Close()
        } catch {
            # Connection failed
        }
    } -ArgumentList $TargetIP, 3000
    
    $jobs += $job
}

Write-Host "Đang chạy 10 kết nối đồng thời..." -ForegroundColor Yellow
Wait-Job $jobs | Out-Null
Remove-Job $jobs

Write-Host "`n================================================================" -ForegroundColor Yellow
Write-Host "✅ Hoàn thành tấn công từ Windows Host!" -ForegroundColor Green
Write-Host "📊 Hãy kiểm tra Dashboard và Kibana để xem kết quả phát hiện" -ForegroundColor Cyan
