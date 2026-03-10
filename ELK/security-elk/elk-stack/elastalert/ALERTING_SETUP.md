# ElastAlert Alerting Setup (Slack/Email)

Tài liệu này hướng dẫn cấu hình gửi cảnh báo qua Slack hoặc Email cho ElastAlert.

## 1) Cấu hình chung

- File cấu hình chính: `elk-stack/elastalert/config.yaml`
- Rule mẫu: `elk-stack/elastalert/rules/failed_login.yaml`

Đảm bảo các service Elasticsearch/ElastAlert đang chạy thông qua `docker-compose.yml`.

## 2) Cảnh báo qua Slack

Có 2 cách:

1. Đặt webhook trực tiếp trong rule

```yaml
# elk-stack/elastalert/rules/failed_login.yaml
name: Failed Login Attempts
type: frequency
index: filebeat-*
num_events: 3
timeframe:
  minutes: 2
filter:
- query:
    query_string:
      query: "auth_message:*Failed*password*"

alert:
- slack
slack_webhook_url: "https://hooks.slack.com/services/XXX/YYY/ZZZ"  # thay bằng webhook của bạn
slack_username_override: "ElastAlert"
slack_emoji_override: ":rotating_light:"
alert_text: |
  Multiple failed login attempts detected!\nWindow: 2 minutes\nCount: {0}
```

2. Tái sử dụng cấu hình chung trong `config.yaml`

```yaml
# elk-stack/elastalert/config.yaml (ví dụ tham khảo)
# ... existing config ...
slack_webhook_url: "https://hooks.slack.com/services/XXX/YYY/ZZZ"
slack_username_override: "ElastAlert"
slack_emoji_override: ":rotating_light:"
```

Khi đó rule chỉ cần:

```yaml
alert:
- slack
```

Lưu ý: ElastAlert không hỗ trợ đọc biến môi trường trực tiếp trong YAML rule. Hãy quản lý secret qua Docker env + template build/CI hoặc mount file config riêng tư khi deploy.

## 3) Cảnh báo qua Email (SMTP)

Cấu hình SMTP trong `config.yaml` hoặc ngay tại rule:

```yaml
# elk-stack/elastalert/config.yaml
# ... existing config ...
smtp_host: "smtp.gmail.com"
smtp_port: 587
from_addr: "alerts@yourdomain.com"
user: "alerts@yourdomain.com"
password: "APP_PASSWORD_OR_TOKEN"
```

Rule sử dụng email:

```yaml
alert:
- email
email:
- "soc-team@yourdomain.com"
```

Nếu dùng Gmail, cần App Password hoặc OAuth2. Với server nội bộ, điền thông tin SMTP tương ứng.

## 4) Kiểm thử nhanh

- Tạo log giả bằng script trong thư mục `scripts/` (ví dụ `simulate_bruteforce.sh`) để sinh events `Failed password`.
- Kiểm tra Kibana có index `filebeat-*` và đã có events phù hợp.
- Quan sát ElastAlert logs để đảm bảo rule được load và alert được gửi.

## 5) Gợi ý vận hành

- Tách rule theo lớp mối đe dọa: đăng nhập, network, ứng dụng, kernel.
- Thêm `realert` để tránh spam.
- Dùng `aggregation_key` nếu cần gom nhóm theo IP/User.
- Quản lý secret (webhook/token) qua secrets manager hoặc mount file ngoài repo.

## 6) Bổ sung rule mẫu

Sao chép `failed_login.yaml` và chỉnh `filter`/`index`/`num_events` theo use case khác (port scan, denied traffic, sudo, su…).


