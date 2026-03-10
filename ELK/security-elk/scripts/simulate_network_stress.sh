#!/bin/bash

echo "🚀 Bắt đầu mô phỏng stress test mạng..."
echo "================================================================"

# Địa chỉ mục tiêu (localhost)
TARGET="127.0.0.1"

# 1. Mô phỏng nhiều kết nối TCP đồng thời
echo "📡 Mô phỏng nhiều kết nối TCP đồng thời..."
for i in {1..20}; do
    echo "Kết nối $i đến port 3000..."
    timeout 2 nc -v $TARGET 3000 &>/dev/null &
    sleep 0.1
done

echo "⏳ Đợi các kết nối hoàn thành..."
sleep 3

# 2. Mô phỏng quét cổng nhanh
echo "🔍 Mô phỏng quét cổng nhanh..."
for PORT in {1000..1100}; do
    nc -zv -w 1 $TARGET $PORT &>/dev/null &
    if (( $PORT % 20 == 0 )); then
        echo "Đã quét đến cổng $PORT..."
        sleep 0.1
    fi
done

# 3. Mô phỏng HTTP requests liên tục
echo "🌐 Mô phỏng HTTP requests liên tục..."
for i in {1..10}; do
    echo "HTTP request $i..."
    curl -s -m 2 http://localhost:3000/ >/dev/null 2>&1 &
    curl -s -m 2 http://localhost:5001/health >/dev/null 2>&1 &
    sleep 0.2
done

echo "⏳ Đợi tất cả các tiến trình hoàn thành..."
wait

echo "================================================================"
echo "✅ Hoàn thành mô phỏng stress test mạng!"
echo "📊 Hãy kiểm tra Packetbeat và Auditbeat trên Kibana để xem traffic được ghi nhận."
