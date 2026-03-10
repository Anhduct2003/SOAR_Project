<#
.SYNOPSIS
  Safe load test + alert (PowerShell)

.DESCRIPTION
  Gửi một số request tới endpoint (mặc định /health), ghi log.
  Nếu số lỗi >= threshold hoặc tỉ lệ lỗi >= threshold_rate thì gửi Telegram + Email.
  CHỈ DÙNG TRONG LAB / ENV ĐƯỢC PHÉP.
#>

param(
  [string]$Target = "http://192.168.179.130:5001/health",
  [int]$Requests = 60,
  [int]$DelayMs = 500,
  [int]$ErrorThreshold = 5,
  [double]$ErrorRateThreshold = 0.20
)

# ---------- CONFIG (thay đổi nếu cần) ----------
# Telegram (đã có token + chat id bạn đưa trước)
$TELEGRAM_BOT_TOKEN = "7206087965:AAHa__By08f7TOYguk0HhHu1cmzPDhOYLAc"
$TELEGRAM_CHAT_ID  = "7054067416"

# SMTP (Gmail) - NÊN DÙNG APP PASSWORD nếu account bật 2FA
$SMTP_USER = "tuyenduy2211@gmail.com"
$SMTP_PASS = "hiic mced tvao dtnp"   # Thay bằng App Password (nếu có)
$MAIL_TO   = "tuyenduy2003@gmail.com"
$MAIL_FROM = $SMTP_USER

# Paths
$LogDir     = Join-Path -Path (Get-Location) -ChildPath "logs"
$RequestLog = Join-Path -Path $LogDir -ChildPath "requests.log"
$Summary    = Join-Path -Path $LogDir -ChildPath "summary.txt"

# ---------- PREP ----------
if (-not (Test-Path $LogDir)) {
  New-Item -Path $LogDir -ItemType Directory | Out-Null
}
# reset logs
"" | Out-File -FilePath $RequestLog -Encoding utf8
"" | Out-File -FilePath $Summary -Encoding utf8

Write-Host "Starting safe simulation at $(Get-Date -Format o)" -ForegroundColor Cyan
Write-Host "Target: $Target" -ForegroundColor Yellow
Write-Host "Requests: $Requests, DelayMs: $DelayMs" -ForegroundColor Yellow
Write-Host "Logs at: $RequestLog" -ForegroundColor Yellow

# ---------- RUN TEST ----------
$errorCount = 0
$totalTimeMs = 0

for ($i = 1; $i -le $Requests; $i++) {
  $ts = (Get-Date).ToString("o")
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $statusCode = "000"
  $timeMs = 0
  try {
    # Use Invoke-WebRequest to capture StatusCode
    $response = Invoke-WebRequest -Uri $Target -Method GET -Headers @{'X-Test'='true'} -TimeoutSec 5 -ErrorAction Stop
    # In success case, get the status code (200 etc.)
    if ($response -and $response.StatusCode) {
      $statusCode = [string]$response.StatusCode
    } else {
      $statusCode = "200"
    }
  } catch {
    # On error, try to extract status code if present; otherwise mark 000
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $statusCode = [string]$_.Exception.Response.StatusCode.Value__
    } else {
      $statusCode = "000"
    }
  } finally {
    $sw.Stop()
    $timeMs = [int]$sw.Elapsed.TotalMilliseconds
  }

  $line = "{0},{1},{2},{3}ms" -f $i, $ts, $statusCode, $timeMs
  $line | Out-File -FilePath $RequestLog -Append -Encoding utf8

  $totalTimeMs += $timeMs
  if (($statusCode -eq "000") -or ([int]$statusCode -ge 500)) {
    $errorCount++
  }

  Start-Sleep -Milliseconds $DelayMs
}

# ---------- SUMMARY ----------
$avgMs = 0
if ($Requests -gt 0) { $avgMs = [int]($totalTimeMs / $Requests) }
$errorRate = 0.0
if ($Requests -gt 0) { $errorRate = [math]::Round(($errorCount / $Requests), 3) }

$summaryText = @"
Simulation summary - $(Get-Date -Format o)
Target: $Target
Requests: $Requests
Delay_ms: $DelayMs
Errors: $errorCount
Error rate: $errorRate
Average response time (ms): $avgMs
Log file: $RequestLog
"@

$summaryText | Out-File -FilePath $Summary -Encoding utf8
Write-Host "Summary:`n$summaryText" -ForegroundColor Green

# ---------- ALERT CONDITIONS ----------
$needAlert = $false
if ($errorCount -ge $ErrorThreshold) { $needAlert = $true }
if ($errorRate -ge $ErrorRateThreshold) { $needAlert = $true }

function Send-Telegram {
  param($text)
  try {
    $api = "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage"
    $body = @{ chat_id = $TELEGRAM_CHAT_ID; text = $text; parse_mode = "Markdown" }
    Invoke-RestMethod -Uri $api -Method Post -Body $body -ErrorAction Stop | Out-Null
    Write-Host "Telegram alert sent." -ForegroundColor Cyan
  } catch {
    Write-Warning "Telegram send failed: $($_.Exception.Message)"
  }
}

function Send-Email {
  param($subject, $bodyText)
  try {
    # build PSCredential for Send-MailMessage
    $secPass = ConvertTo-SecureString -String $SMTP_PASS -AsPlainText -Force
    $cred = New-Object System.Management.Automation.PSCredential ($SMTP_USER, $secPass)

    Send-MailMessage -From $MAIL_FROM -To $MAIL_TO -Subject $subject -Body $bodyText -SmtpServer "smtp.gmail.com" -Port 587 -UseSsl -Credential $cred -DeliveryNotificationOption OnFailure -ErrorAction Stop
    Write-Host "Email alert sent." -ForegroundColor Cyan
  } catch {
    Write-Warning "Email send failed: $($_.Exception.Message)"
  }
}

if ($needAlert) {
  $alertText = "⚠️ *Lab Alert*: issues detected on target`nTarget: $Target`nErrors: $errorCount/$Requests (rate: $errorRate)`nAvg RTT: ${avgMs} ms`nTime: $(Get-Date -Format o)"
  Send-Telegram -text $alertText

  $subject = "Lab Alert: issues detected on $Target"
  Send-Email -subject $subject -bodyText $summaryText
} else {
  Write-Host "No alert conditions met (errors: $errorCount, rate: $errorRate)." -ForegroundColor Green
}

Write-Host "Done." -ForegroundColor Magenta
