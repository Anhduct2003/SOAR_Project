#!/usr/bin/env bash
# simulate_requests_and_alert.sh
# Mô phỏng tải an toàn, ghi log, gửi alert Telegram + Email khi lỗi vượt ngưỡng.
# *** CHỈ DÙNG TRONG LAB / MÔI TRƯỜNG ĐƯỢC PHÉP ***

set -euo pipefail

# ------------- CONFIG (đã điền theo yêu cầu) -------------
TARGET="${TARGET:-http://192.168.179.130:5001/health}"
REQUESTS="${REQUESTS:-60}"           # tổng số request
DELAY_MS="${DELAY_MS:-500}"          # delay giữa request (ms)
ERROR_THRESHOLD="${ERROR_THRESHOLD:-5}"   # số lỗi tối thiểu để trigger alert
ERROR_RATE_THRESHOLD="${ERROR_RATE_THRESHOLD:-0.20}" # 20% lỗi -> trigger

# Telegram (đã điền token + chat id bạn cung cấp)
TELEGRAM_BOT_TOKEN="7206087965:AAHa__By08f7TOYguk0HhHu1cmzPDhOYLAc"
TELEGRAM_CHAT_ID="7054067416"

# SMTP (Gmail example using App Password)
SMTP_USER="tuyenduy2211@gmail.com"
SMTP_PASS="hiic mced tvao dtnp"   # nếu dùng Gmail: nên là App Password (16 ký tự)
MAIL_TO="tuyenduy2003@gmail.com"
MAIL_FROM="${SMTP_USER}"

# Paths
LOGDIR="./logs"
REQUEST_LOG="$LOGDIR/requests.log"
SUMMARY="$LOGDIR/summary.txt"

# ------------- PREP -------------
mkdir -p "$LOGDIR"
: > "$REQUEST_LOG"
: > "$SUMMARY"

echo "Starting safe simulation at $(date -Is)"
echo "Target: $TARGET"
echo "Requests: $REQUESTS, Delay: ${DELAY_MS}ms"
echo "Logs at: $REQUEST_LOG"
echo

# ------------- RUN TEST -------------
error_count=0
total_time_ms=0

for i in $(seq 1 "$REQUESTS"); do
  ts=$(date -Is)
  # measure roughly in ms
  start_ms=$(date +%s%3N 2>/dev/null || { start_s=$(date +%s); echo $((start_s*1000)); })
  # include header to mark this as test; useful for filtering in logs
  response=$(curl -s -o /dev/null -w "%{http_code} %{time_total}" -H "X-Test: true" "$TARGET" --max-time 5) || response="000 0"
  http_code=$(echo "$response" | awk '{print $1}')
  time_total=$(echo "$response" | awk '{print $2}')
  # convert time_total (seconds float) to ms integer
  t_ms=$(awk "BEGIN {printf \"%d\", (${time_total}*1000)}")
  end_ms=$(date +%s%3N 2>/dev/null || { end_s=$(date +%s); echo $((end_s*1000)); })
  elapsed_ms=$((end_ms - start_ms))

  echo "$i,$ts,$http_code,${t_ms}ms,elapsed:${elapsed_ms}ms" >> "$REQUEST_LOG"

  total_time_ms=$((total_time_ms + t_ms))
  if [ "$http_code" -ge 500 ] || [ "$http_code" -eq 000 ]; then
    error_count=$((error_count + 1))
  fi

  # small sleep
  sleep_seconds=$(awk "BEGIN {printf \"%.3f\", ${DELAY_MS}/1000}")
  sleep "$sleep_seconds"
done

# ------------- SUMMARY -------------
avg_ms=0
if [ "$REQUESTS" -gt 0 ]; then
  avg_ms=$(( total_time_ms / REQUESTS ))
fi
# error_rate as fraction
error_rate=$(awk "BEGIN {printf \"%.3f\", ${error_count}/${REQUESTS}}")

cat > "$SUMMARY" <<EOF
Simulation summary - $(date -Is)
Target: $TARGET
Requests: $REQUESTS
Delay_ms: $DELAY_MS
Errors: $error_count
Error rate: $error_rate
Average response time (ms): $avg_ms
Log file: $REQUEST_LOG
EOF

echo "Summary:"
cat "$SUMMARY"
echo

# ------------- ALERTING -------------
need_alert=0

# Trigger conditions
if [ "$error_count" -ge "$ERROR_THRESHOLD" ]; then
  need_alert=1
fi

# compare error rate threshold (float)
awk -v er="$error_rate" -v thr="$ERROR_RATE_THRESHOLD" 'BEGIN { if (er >= thr) {exit 0} else {exit 1} }'
if [ $? -eq 0 ]; then
  need_alert=1
fi

send_telegram() {
  local text="$1"
  local api="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage"
  curl -s -X POST "$api" -d chat_id="$TELEGRAM_CHAT_ID" \
    -d parse_mode="Markdown" \
    --data-urlencode text:"$text" >/dev/null || true
}

send_email_via_smtp() {
  # Uses curl SMTP to send email via Gmail SMTPS (465)
  local subject="$1"
  local body
  body=$(cat "$SUMMARY")
  local tmpmsg
  tmpmsg=$(mktemp)
  {
    echo "From: ${MAIL_FROM}"
    echo "To: ${MAIL_TO}"
    echo "Subject: ${subject}"
    echo "Content-Type: text/plain; charset=utf-8"
    echo
    echo "$body"
  } > "$tmpmsg"

  curl -s --url "smtps://smtp.gmail.com:465" --ssl-reqd \
    --mail-from "$MAIL_FROM" --mail-rcpt "$MAIL_TO" \
    --user "${SMTP_USER}:${SMTP_PASS}" \
    -T "$tmpmsg" --insecure >/dev/null 2>&1 || true

  rm -f "$tmpmsg"
}

if [ "$need_alert" -eq 1 ]; then
  ALERT_TEXT="⚠️ *Lab Alert*: issues detected on target\nTarget: ${TARGET}\nErrors: ${error_count}/${REQUESTS} (rate: ${error_rate})\nAvg RTT: ${avg_ms} ms\nTime: $(date -Is)"
  echo "Sending Telegram alert..."
  send_telegram "$ALERT_TEXT"

  echo "Sending Email alert..."
  send_email_via_smtp "Lab Alert: issues detected on ${TARGET}"
  echo "Alerts sent."
else
  echo "No alert conditions met (errors: $error_count, rate: $error_rate)."
fi

echo "Done."
