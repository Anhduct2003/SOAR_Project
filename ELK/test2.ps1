param(
  [int]$Count = 5,
  [string]$BackendUrl = "http://localhost:5001",
  [int]$SleepSec = 0
)

# test2.ps1
# Generate 5 different incident types for dashboard testing on Windows.

$ErrorActionPreference = "Stop"

$incidents = @(
  @{
    rule_name = "Phishing Email - Fake PayPal"
    title = "Phishing Email - Fake PayPal"
    description = "A fake PayPal email asks the user to verify the account through a suspicious URL."
    severity = "high"
    category = "phishing"
    source_ip = "192.168.56.101"
  },
  @{
    rule_name = "Malware Detection - Suspicious Executable"
    title = "Malware Detection - Suspicious Executable"
    description = "Endpoint telemetry detected a suspicious executable running from a temporary directory."
    severity = "critical"
    category = "malware"
    source_ip = "192.168.56.102"
  },
  @{
    rule_name = "DDoS Spike - High Traffic Volume"
    title = "DDoS Spike - High Traffic Volume"
    description = "Network monitoring detected an abnormal spike of requests from a single source."
    severity = "critical"
    category = "ddos"
    source_ip = "203.0.113.20"
  },
  @{
    rule_name = "Data Breach - Unusual Export"
    title = "Data Breach - Unusual Export"
    description = "Large data export detected outside normal business hours."
    severity = "critical"
    category = "data_breach"
    source_ip = "10.10.20.15"
  },
  @{
    rule_name = "Web Application Attack - SQL Injection"
    title = "Web Application Attack - SQL Injection"
    description = "Web logs contain SQL injection patterns targeting the login endpoint."
    severity = "high"
    category = "web_application"
    source_ip = "198.51.100.44"
  },
  @{
    rule_name = "Insider Threat - Privilege Misuse"
    title = "Insider Threat - Privilege Misuse"
    description = "A privileged user accessed restricted records repeatedly without an approved ticket."
    severity = "medium"
    category = "insider_threat"
    source_ip = "10.10.30.25"
  },
  @{
    rule_name = "Network Intrusion - Port Scan"
    title = "Network Intrusion - Port Scan"
    description = "Multiple ports were scanned across internal services in a short time window."
    severity = "high"
    category = "network_intrusion"
    source_ip = "172.16.5.77"
  },
  @{
    rule_name = "Social Engineering - Fake Helpdesk"
    title = "Social Engineering - Fake Helpdesk"
    description = "User reported a fake helpdesk call requesting MFA approval."
    severity = "medium"
    category = "social_engineering"
    source_ip = "192.168.56.108"
  },
  @{
    rule_name = "Physical Security - Badge Tailgating"
    title = "Physical Security - Badge Tailgating"
    description = "Badge system flagged a possible tailgating event at the server room entrance."
    severity = "low"
    category = "physical_security"
    source_ip = "192.168.56.109"
  },
  @{
    rule_name = "Other Alert - Unknown Suspicious Activity"
    title = "Other Alert - Unknown Suspicious Activity"
    description = "Generic test alert for unknown suspicious activity."
    severity = "low"
    category = "other"
    source_ip = "192.168.56.110"
  }
)

if ($Count -le 0 -or $Count -gt $incidents.Count) {
  $Count = $incidents.Count
}

Write-Host "Creating $Count test incident(s) at $BackendUrl..."

for ($i = 0; $i -lt $Count; $i++) {
  $payload = $incidents[$i].Clone()
  $payload["description"] = "$($payload["description"]) Test batch time: $(Get-Date -Format o)"

  $response = Invoke-RestMethod `
    -Method Post `
    -Uri "$BackendUrl/api/alerts/webhook" `
    -ContentType "application/json; charset=utf-8" `
    -Body ($payload | ConvertTo-Json -Depth 5)

  Write-Host "[$($i + 1)/$Count] Created $($payload["category"]) incident: $($response.id)"

  if ($SleepSec -gt 0 -and $i -lt ($Count - 1)) {
    Start-Sleep -Seconds $SleepSec
  }
}

Write-Host "Done. Refresh Dashboard or Alerts page."
