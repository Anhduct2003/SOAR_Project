#!/bin/bash

# Script tổng hợp để demo Security Incident Response Dashboard
echo "🎯 DEMO SECURITY INCIDENT RESPONSE DASHBOARD"
echo "================================================================"
echo "IP Ubuntu VM: 192.168.1.8"
echo "Dashboard: http://192.168.1.8:3000"
echo "Kibana: http://192.168.1.8:5601"
echo "Backend API: http://192.168.1.8:5001"
echo "================================================================"

# Kiểm tra services
echo "🔍 Kiểm tra trạng thái services..."
docker compose ps | grep -E "(backend|frontend|elasticsearch|kibana)"

echo ""
echo "📊 Thông tin truy cập:"
echo "- Dashboard: http://192.168.1.8:3000"
echo "- Đăng nhập: admin@security.local / admin123"
echo "- Kibana: http://192.168.1.8:5601"
echo ""

# Menu lựa chọn
echo "🎬 Chọn kịch bản demo:"
echo "1. Brute Force Attack (15 failed logins)"
echo "2. Port Scanning (quét cổng 1-100)"
echo "3. Network Stress Test (flood connections)"
echo "4. Tạo sự cố bảo mật tự động (5 incidents)"
echo "5. Chạy tất cả attacks"
echo "6. Chỉ hiển thị thông tin truy cập"
echo ""

read -p "Nhập lựa chọn (1-6): " choice

case $choice in
    1)
        echo "🔐 Chạy Brute Force Attack..."
        chmod +x scripts/simulate_bruteforce.sh
        ./scripts/simulate_bruteforce.sh
        ;;
    2)
        echo "🔍 Chạy Port Scanning..."
        chmod +x scripts/simulate_portscan.sh
        ./scripts/simulate_portscan.sh
        ;;
    3)
        echo "🌊 Chạy Network Stress Test..."
        chmod +x scripts/simulate_network_stress.sh
        ./scripts/simulate_network_stress.sh
        ;;
    4)
        echo "📝 Tạo sự cố bảo mật..."
        chmod +x scripts/create_security_events.sh
        ./scripts/create_security_events.sh
        ;;
    5)
        echo "🚀 Chạy tất cả attacks..."
        echo ""
        echo "1️⃣ Brute Force Attack..."
        chmod +x scripts/simulate_bruteforce.sh
        ./scripts/simulate_bruteforce.sh
        echo ""
        echo "2️⃣ Port Scanning..."
        chmod +x scripts/simulate_portscan.sh
        ./scripts/simulate_portscan.sh
        echo ""
        echo "3️⃣ Network Stress Test..."
        chmod +x scripts/simulate_network_stress.sh
        ./scripts/simulate_network_stress.sh
        echo ""
        echo "4️⃣ Tạo sự cố bảo mật..."
        chmod +x scripts/create_security_events.sh
        ./scripts/create_security_events.sh
        ;;
    6)
        echo "📋 Thông tin truy cập hệ thống:"
        ;;
    *)
        echo "❌ Lựa chọn không hợp lệ!"
        exit 1
        ;;
esac

echo ""
echo "================================================================"
echo "✅ Hoàn thành demo!"
echo ""
echo "📱 Truy cập Dashboard để xem kết quả:"
echo "   http://192.168.1.8:3000"
echo ""
echo "📊 Truy cập Kibana để xem logs:"
echo "   http://192.168.1.8:5601"
echo ""
echo "🔧 Scripts tấn công từ Windows Host:"
echo "   Copy file attack_from_windows.ps1 và chạy:"
echo "   .\attack_from_windows.ps1 -TargetIP 192.168.1.8"
echo ""
echo "📝 Hướng dẫn chi tiết: xem file DEMO_GUIDE.md"
echo "================================================================"
