#!/bin/bash

# Script tạo các sự kiện bảo mật thông qua API
echo "Bắt đầu tạo các sự kiện bảo mật mô phỏng..."

# Đăng nhập để lấy token
echo "Đăng nhập để lấy token..."
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:5001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@security.local", "password":"admin123"}')

# Trích xuất token từ phản hồi
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "Không thể lấy token xác thực. Vui lòng kiểm tra lại thông tin đăng nhập."
  exit 1
fi

echo "Đã lấy token xác thực thành công!"

# Danh sách các loại sự cố - phải khớp với enum trong model
INCIDENT_TYPES=("malware" "phishing" "data_breach" "ddos" "insider_threat" "network_intrusion" "web_application" "social_engineering")
SEVERITY_LEVELS=("low" "medium" "high" "critical")
SOURCE_IPS=("192.168.1.100" "10.0.0.25" "172.16.10.5" "45.33.12.67" "91.234.56.78")
AFFECTED_SYSTEMS=("web-server-01" "database-01" "mail-server" "file-server" "application-server")

# Tạo ngẫu nhiên các sự cố bảo mật
create_random_incident() {
  # Chọn ngẫu nhiên từ các danh sách
  TYPE=${INCIDENT_TYPES[$((RANDOM % ${#INCIDENT_TYPES[@]}))]}
  SEVERITY=${SEVERITY_LEVELS[$((RANDOM % ${#SEVERITY_LEVELS[@]}))]}
  SOURCE_IP=${SOURCE_IPS[$((RANDOM % ${#SOURCE_IPS[@]}))]}
  SYSTEM=${AFFECTED_SYSTEMS[$((RANDOM % ${#AFFECTED_SYSTEMS[@]}))]}
  
  # Tạo mô tả dựa trên loại
  case "$TYPE" in
    "malware")
      TITLE="Phát hiện phần mềm độc hại"
      DESC="Phát hiện phần mềm độc hại trên ${SYSTEM}. Có khả năng đã lây nhiễm từ IP ${SOURCE_IP}"
      ;;
    "phishing")
      TITLE="Chiến dịch phishing phát hiện"
      DESC="Phát hiện email phishing nhắm vào người dùng trên ${SYSTEM}. Nguồn có thể từ IP ${SOURCE_IP}"
      ;;
    "data_breach")
      TITLE="Nghi ngờ rò rỉ dữ liệu"
      DESC="Phát hiện truyền dữ liệu bất thường từ ${SYSTEM} đến IP ngoài ${SOURCE_IP}"
      ;;
    "ddos")
      TITLE="Tấn công từ chối dịch vụ"
      DESC="Phát hiện dấu hiệu tấn công DDoS nhắm vào ${SYSTEM} từ IP ${SOURCE_IP}"
      ;;
    "insider_threat")
      TITLE="Mối đe dọa nội bộ"
      DESC="Phát hiện hoạt động đáng ngờ từ người dùng nội bộ trên ${SYSTEM}, liên quan đến IP ${SOURCE_IP}"
      ;;
    "network_intrusion")
      TITLE="Phát hiện xâm nhập mạng"
      DESC="Phát hiện dấu hiệu xâm nhập mạng vào ${SYSTEM} từ IP ${SOURCE_IP}"
      ;;
    "web_application")
      TITLE="Lỗ hổng ứng dụng web"
      DESC="Phát hiện nỗ lực khai thác lỗ hổng ứng dụng web trên ${SYSTEM} từ IP ${SOURCE_IP}"
      ;;
    "social_engineering")
      TITLE="Tấn công kỹ thuật xã hội"
      DESC="Phát hiện nỗ lực tấn công kỹ thuật xã hội nhắm vào người dùng của ${SYSTEM} từ IP ${SOURCE_IP}"
      ;;
    *)
      TITLE="Sự cố bảo mật không xác định"
      DESC="Phát hiện hoạt động bất thường trên ${SYSTEM} từ IP ${SOURCE_IP}"
      ;;
  esac
  
  # Tạo sự cố thông qua API
  echo "Tạo sự cố: $TITLE"
  RESPONSE=$(curl -s -X POST "http://localhost:5001/api/incidents" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"title\": \"$TITLE\",
      \"description\": \"$DESC\",
      \"severity\": \"$SEVERITY\",
      \"category\": \"$TYPE\",
      \"source\": \"automated\",
      \"sourceIp\": \"$SOURCE_IP\",
      \"affectedSystems\": [\"$SYSTEM\"],
      \"tags\": [\"$TYPE\", \"$SEVERITY\", \"simulation\"]
    }")
    
  echo "Phản hồi: $RESPONSE"
  sleep 2
}

# Tạo một số sự cố ngẫu nhiên
echo "Bắt đầu tạo các sự cố bảo mật..."
for i in {1..5}; do
  echo "Tạo sự cố $i/5"
  create_random_incident
done

echo "Hoàn thành tạo các sự kiện bảo mật mô phỏng!"
