#!/usr/bin/env bash
# send_tele_alerts.sh
# Gửi cảnh báo PHISHING theo format như ảnh Telegram

set -euo pipefail

BOT_TOKEN="YOUR_BOT_TOKEN"
CHAT_ID="YOUR_CHAT_ID"
KIBANA_URL="http://localhost:5601/app/discover"
SLEEP_SEC=2

messages=(
$'🧨 *Phát hiện Email Lừa Đảo!*\n\n📧 *Chi tiết Email:*\n- Người gửi: security@fake-paypal.com\n- Tiêu đề: ⚠️  Tài khoản PayPal bị hạn chế – Cần xác minh ngay\n- Mức độ nguy hiểm: *HIGH*\n\n🤖 *Phân tích AI:*\n- Điểm ML: 0.96\n- Độ tin cậy LLM: 0.94\n- Giải thích: Email giả mạo PayPal, tạo tính khẩn cấp, yêu cầu bấm link đáng ngờ, domain giả.\n\n⚠️ *Dấu hiệu nguy hiểm:*\n- Từ khoá đáng ngờ: 6\n- URL trong blacklist: Có ✓\n- URLs phát hiện: http://paypal-security.fake.com/unlock\n\n🔎 Xem chi tiết trong Kibana: '"$KIBANA_URL"

$'🧨 *Phát hiện Email Lừa Đảo!*\n\n📧 *Chi tiết Email:*\n- Người gửi: no-reply@vietcombank-secure.com\n- Tiêu đề: 🚨 XÁC THỰC: Tài khoản của bạn sẽ bị khoá\n- Mức độ nguy hiểm: *HIGH*\n\n🤖 *Phân tích AI:*\n- Điểm ML: 0.93\n- Độ tin cậy LLM: 0.91\n- Giải thích: Mạo danh ngân hàng, đe doạ khoá tài khoản, yêu cầu nhập OTP qua link lạ.\n\n⚠️ *Dấu hiệu nguy hiểm:*\n- Từ khoá đáng ngờ: 7\n- URL trong blacklist: Có ✓\n- URLs phát hiện: http://vietcombank-verify.fake.com/urgent\n\n🔎 Xem chi tiết trong Kibana: '"$KIBANA_URL"

$'🧨 *Phát hiện Email Lừa Đảo!*\n\n📧 *Chi tiết Email:*\n- Người gửi: id.apple@support-verify.co\n- Tiêu đề: ⚠️ Apple ID của bạn đã bị đăng nhập trái phép\n- Mức độ nguy hiểm: *MEDIUM*\n\n🤖 *Phân tích AI:*\n- Điểm ML: 0.89\n- Độ tin cậy LLM: 0.90\n- Giải thích: Nội dung hối thúc xác minh, đề nghị “khôi phục ngay”, liên kết chuyển hướng.\n\n⚠️ *Dấu hiệu nguy hiểm:*\n- Từ khoá đáng ngờ: 5\n- URL trong blacklist: Có ✓\n- URLs phát hiện: http://iforgot-apple.fake.id/restore\n\n🔎 Xem chi tiết trong Kibana: '"$KIBANA_URL"

$'🧨 *Phát hiện Email Lừa Đảo!*\n\n📧 *Chi tiết Email:*\n- Người gửi: fake-bank@phishing.com\n- Tiêu đề: 🛑 CẢNH BÁO: Tài khoản của bạn bất thường\n- Mức độ nguy hiểm: *CRITICAL*\n\n🤖 *Phân tích AI:*\n- Điểm ML: 0.97\n- Độ tin cậy LLM: 0.95\n- Giải thích: Mạo danh ngân hàng, yêu cầu xác nhận thông tin nhạy cảm qua form giả.\n\n⚠️ *Dấu hiệu nguy hiểm:*\n- Từ khoá đáng ngờ: 9\n- URL trong blacklist: Có ✓\n- URLs phát hiện: http://secure-bank.fake-login.com/auth\n\n🔎 Xem chi tiết trong Kibana: '"$KIBANA_URL"

$'🧨 *Phát hiện Email Lừa Đảo!*\n\n📧 *Chi tiết Email:*\n- Người gửi: mail-security@google-verify.co\n- Tiêu đề: ⚠️ Thư của bạn sẽ bị ngừng vì vượt dung lượng\n- Mức độ nguy hiểm: *HIGH*\n\n🤖 *Phân tích AI:*\n- Điểm ML: 0.92\n- Độ tin cậy LLM: 0.93\n- Giải thích: Đe doạ ngừng dịch vụ, yêu cầu đăng nhập lại, domain không thuộc Google.\n\n⚠️ *Dấu hiệu nguy hiểm:*\n- Từ khoá đáng ngờ: 6\n- URL trong blacklist: Có ✓\n- URLs phát hiện: http://mail-google.fake.com/re-activate\n\n🔎 Xem chi tiết trong Kibana: '"$KIBANA_URL"
)

COUNT=${1:-${#messages[@]}}
if [ "$COUNT" -gt "${#messages[@]}" ]; then COUNT=${#messages[@]}; fi

echo "Sending $COUNT messages..."
for i in $(seq 0 $((COUNT-1))); do
  msg="${messages[$i]}"
  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${CHAT_ID}" \
    --data-urlencode "text=${msg}" \
    -d "parse_mode=Markdown" > /dev/null
  echo "Sent message $((i+1))"
  sleep "$SLEEP_SEC"
done
echo "Done."
