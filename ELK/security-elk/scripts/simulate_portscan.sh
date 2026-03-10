#!/bin/bash

# Script mô phỏng quét cổng (port scanning)
echo "Bắt đầu mô phỏng quét cổng..."

# Địa chỉ để quét
TARGET="localhost"

# Danh sách cổng thông thường
PORTS=(22 80 443 3000 3306 5001 5432 8080 9000 9200 9300 27017)

echo "Quét một số cổng phổ biến..."
for PORT in "${PORTS[@]}"; do
  echo "Kiểm tra cổng $PORT"
  nc -zv -w 1 $TARGET $PORT 2>&1
  sleep 0.5
done

echo -e "\nQuét nhanh một dải cổng..."
for PORT in {1..100}; do
  nc -zv -w 1 $TARGET $PORT >/dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "Cổng $PORT mở"
  fi
  sleep 0.1
done

echo -e "\nHoàn thành mô phỏng quét cổng!"
