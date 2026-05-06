param(
  [int]$Count = 0,
  [ValidateSet("Telegram", "Webhook", "Both")]
  [string]$Mode = "Telegram",
  [string]$BackendUrl = "http://localhost:5001"
)

# send_tele_alerts.ps1
# Windows-friendly test script for Telegram alerts and dashboard webhook incidents.

$ErrorActionPreference = "Stop"

$BOT_TOKEN = "YOUR_BOT_TOKEN"
$CHAT_ID = "YOUR_CHAT_ID"
$KIBANA_URL = "http://localhost:5601/app/discover"
$SLEEP_SEC = 2

function Get-DotEnvValue {
  param(
    [string]$Path,
    [string]$Name
  )

  if (-not (Test-Path $Path)) {
    return $null
  }

  $line = Get-Content -Path $Path | Where-Object {
    $_ -match "^\s*$([regex]::Escape($Name))\s*="
  } | Select-Object -First 1

  if (-not $line) {
    return $null
  }

  return (($line -split "=", 2)[1]).Trim().Trim('"').Trim("'")
}

function Send-TelegramMessage {
  param(
    [string]$BotToken,
    [string]$ChatId,
    [string]$Text
  )

  $payload = @{
    chat_id = $ChatId
    text = $Text
    parse_mode = "Markdown"
    disable_web_page_preview = $true
  } | ConvertTo-Json -Depth 5

  $utf8Body = [System.Text.Encoding]::UTF8.GetBytes($payload)

  Invoke-RestMethod `
    -Method Post `
    -Uri "https://api.telegram.org/bot$BotToken/sendMessage" `
    -ContentType "application/json; charset=utf-8" `
    -Body $utf8Body | Out-Null
}

$envPath = Join-Path $PSScriptRoot "security-elk\.env"
$envBotToken = Get-DotEnvValue -Path $envPath -Name "TELEGRAM_BOT_TOKEN"
$envChatId = Get-DotEnvValue -Path $envPath -Name "TELEGRAM_CHAT_ID"

if ($envBotToken) {
  $BOT_TOKEN = $envBotToken
}

if ($envChatId) {
  $CHAT_ID = $envChatId
}

$messages = @(
@"
*PHISHING EMAIL DETECTED*

*Email details*
- Sender: security@fake-paypal.com
- Subject: PayPal account limited - verification required
- Severity: *HIGH*

*AI analysis*
- ML score: 0.96
- LLM confidence: 0.94
- Reason: Fake PayPal email creates urgency and asks the user to open a suspicious link.

*Threat indicators*
- Suspicious keywords: 6
- Blacklisted URL: yes
- Detected URL: http://paypal-security.fake.com/unlock

Kibana details: $KIBANA_URL
"@,
@"
*PHISHING EMAIL DETECTED*

*Email details*
- Sender: no-reply@vietcombank-secure.com
- Subject: Account verification required before lock
- Severity: *HIGH*

*AI analysis*
- ML score: 0.93
- LLM confidence: 0.91
- Reason: Fake banking email threatens account lock and asks for OTP through an unknown link.

*Threat indicators*
- Suspicious keywords: 7
- Blacklisted URL: yes
- Detected URL: http://vietcombank-verify.fake.com/urgent

Kibana details: $KIBANA_URL
"@,
@"
*PHISHING EMAIL DETECTED*

*Email details*
- Sender: id.apple@support-verify.co
- Subject: Apple ID suspicious login detected
- Severity: *MEDIUM*

*AI analysis*
- ML score: 0.89
- LLM confidence: 0.90
- Reason: Urgent account recovery text contains a redirect link.

*Threat indicators*
- Suspicious keywords: 5
- Blacklisted URL: yes
- Detected URL: http://iforgot-apple.fake.id/restore

Kibana details: $KIBANA_URL
"@,
@"
*PHISHING EMAIL DETECTED*

*Email details*
- Sender: fake-bank@phishing.com
- Subject: Bank account abnormal activity warning
- Severity: *CRITICAL*

*AI analysis*
- ML score: 0.97
- LLM confidence: 0.95
- Reason: Fake bank login form requests sensitive account information.

*Threat indicators*
- Suspicious keywords: 9
- Blacklisted URL: yes
- Detected URL: http://secure-bank.fake-login.com/auth

Kibana details: $KIBANA_URL
"@,
@"
*PHISHING EMAIL DETECTED*

*Email details*
- Sender: mail-security@google-verify.co
- Subject: Mail service will stop due to quota limit
- Severity: *HIGH*

*AI analysis*
- ML score: 0.92
- LLM confidence: 0.93
- Reason: Fake Google domain asks the user to sign in again.

*Threat indicators*
- Suspicious keywords: 6
- Blacklisted URL: yes
- Detected URL: http://mail-google.fake.com/re-activate

Kibana details: $KIBANA_URL
"@
)

$webhookPayloads = @(
  @{
    rule_name = "Phishing Email - Fake PayPal"
    title = "Phishing Email - Fake PayPal"
    description = "Fake PayPal email asks the user to verify the account through a suspicious URL."
    severity = "high"
    category = "phishing"
    source_ip = "192.168.56.101"
  },
  @{
    rule_name = "Phishing Email - Fake Vietcombank"
    title = "Phishing Email - Fake Vietcombank"
    description = "Fake banking email threatens account lock and asks for OTP through an unknown link."
    severity = "high"
    category = "phishing"
    source_ip = "192.168.56.102"
  },
  @{
    rule_name = "Phishing Email - Apple ID"
    title = "Phishing Email - Apple ID"
    description = "Suspicious Apple ID recovery email contains a redirect URL and urgent verification text."
    severity = "medium"
    category = "phishing"
    source_ip = "192.168.56.103"
  },
  @{
    rule_name = "Critical Fake Bank Login"
    title = "Critical Fake Bank Login"
    description = "Fake bank login form requests sensitive account information."
    severity = "critical"
    category = "phishing"
    source_ip = "192.168.56.104"
  },
  @{
    rule_name = "Fake Google Mail Quota"
    title = "Fake Google Mail Quota"
    description = "Fake Google mail quota email asks the user to reactivate the mailbox through a fake domain."
    severity = "high"
    category = "phishing"
    source_ip = "192.168.56.105"
  }
)

if ($Count -le 0 -or $Count -gt $messages.Count) {
  $Count = $messages.Count
}

Write-Host "Running $Mode test with $Count item(s)..."

for ($i = 0; $i -lt $Count; $i++) {
  if ($Mode -eq "Telegram" -or $Mode -eq "Both") {
    if ($BOT_TOKEN -eq "YOUR_BOT_TOKEN" -or $CHAT_ID -eq "YOUR_CHAT_ID") {
      Write-Warning "Telegram config is missing. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in security-elk\.env."
    } else {
      Send-TelegramMessage -BotToken $BOT_TOKEN -ChatId $CHAT_ID -Text $messages[$i]
      Write-Host "Sent Telegram message $($i + 1)"
    }
  }

  if ($Mode -eq "Webhook" -or $Mode -eq "Both") {
    $payload = $webhookPayloads[$i]
    $response = Invoke-RestMethod `
      -Method Post `
      -Uri "$BackendUrl/api/alerts/webhook" `
      -ContentType "application/json; charset=utf-8" `
      -Body ($payload | ConvertTo-Json -Depth 5)

    Write-Host "Created dashboard incident $($i + 1): $($response.id)"
  }

  Start-Sleep -Seconds $SLEEP_SEC
}

Write-Host "Done."
