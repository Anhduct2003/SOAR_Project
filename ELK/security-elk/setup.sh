#!/bin/bash

# Security ELK Stack Setup Script
# Tự động cài đặt và cấu hình toàn bộ hệ thống

set -e  # Exit on any error

echo "🚀 Security ELK Stack Setup Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "Script không nên chạy với quyền root. Vui lòng chạy với user thường."
   exit 1
fi

# Check Docker installation
print_step "Kiểm tra Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker chưa được cài đặt. Vui lòng cài đặt Docker trước."
    echo "Hướng dẫn cài đặt: https://docs.docker.com/engine/install/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose chưa được cài đặt. Vui lòng cài đặt Docker Compose trước."
    echo "Hướng dẫn cài đặt: https://docs.docker.com/compose/install/"
    exit 1
fi

print_status "Docker và Docker Compose đã được cài đặt ✓"

# Check Docker daemon
print_step "Kiểm tra Docker daemon..."
if ! docker info &> /dev/null; then
    print_error "Docker daemon không chạy. Vui lòng khởi động Docker service:"
    echo "sudo systemctl start docker"
    exit 1
fi

print_status "Docker daemon đang chạy ✓"

# Set system parameters for Elasticsearch
print_step "Cấu hình system parameters cho Elasticsearch..."
if [ "$(cat /proc/sys/vm/max_map_count)" -lt 262144 ]; then
    print_warning "Tăng vm.max_map_count cho Elasticsearch..."
    sudo sysctl -w vm.max_map_count=262144
    
    # Make it permanent
    if ! grep -q "vm.max_map_count=262144" /etc/sysctl.conf; then
        echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
        print_status "Đã cấu hình vm.max_map_count vĩnh viễn"
    fi
fi

# Check available memory
print_step "Kiểm tra RAM available..."
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
if [ "$TOTAL_MEM" -lt 4000 ]; then
    print_warning "RAM hiện tại: ${TOTAL_MEM}MB - Khuyến nghị tối thiểu 4GB"
    print_warning "Hệ thống có thể chạy chậm với RAM thấp"
else
    print_status "RAM: ${TOTAL_MEM}MB ✓"
fi

# Check available disk space
print_step "Kiểm tra dung lượng ổ cứng..."
AVAILABLE_SPACE=$(df . | awk 'NR==2 {print $4}')
AVAILABLE_GB=$((AVAILABLE_SPACE / 1024 / 1024))
if [ "$AVAILABLE_GB" -lt 5 ]; then
    print_warning "Dung lượng trống: ${AVAILABLE_GB}GB - Khuyến nghị tối thiểu 5GB"
    print_warning "Có thể không đủ dung lượng cho Elasticsearch data"
else
    print_status "Dung lượng trống: ${AVAILABLE_GB}GB ✓"
fi

# Create necessary directories
print_step "Tạo thư mục cần thiết..."
mkdir -p logs
mkdir -p data/elasticsearch
mkdir -p data/mongodb

# Build and start services
print_step "Build và khởi động services..."
print_status "Đang build Docker images (có thể mất vài phút)..."

# Use docker compose or docker-compose based on availability
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

$COMPOSE_CMD build --no-cache

print_status "Đang khởi động services..."
$COMPOSE_CMD up -d

# Wait for services to be healthy
print_step "Chờ services khởi động hoàn toàn..."
print_status "Kiểm tra trạng thái services..."

# Function to check service health
check_service() {
    local service=$1
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if $COMPOSE_CMD ps $service | grep -q "healthy\|Up"; then
            return 0
        fi
        print_status "Chờ $service khởi động... ($attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    return 1
}

# Check critical services
services=("elasticsearch" "mongodb" "backend" "frontend")
for service in "${services[@]}"; do
    if ! check_service $service; then
        print_error "Service $service không khởi động được"
        print_status "Xem logs: $COMPOSE_CMD logs $service"
        exit 1
    fi
    print_status "$service đã sẵn sàng ✓"
done

# Reset admin password to ensure it works
print_step "Reset admin password..."
if $COMPOSE_CMD exec -T backend node scripts/reset-admin-password.js; then
    print_status "Admin password đã được reset ✓"
else
    print_warning "Không thể reset admin password tự động"
fi

# Test API endpoints
print_step "Kiểm tra API endpoints..."
sleep 5

# Test health endpoint
if curl -s http://localhost:5001/health > /dev/null; then
    print_status "Backend API hoạt động ✓"
else
    print_warning "Backend API chưa sẵn sàng"
fi

# Test frontend
if curl -s http://localhost:3000 > /dev/null; then
    print_status "Frontend hoạt động ✓"
else
    print_warning "Frontend chưa sẵn sàng"
fi

# Test Elasticsearch
if curl -s http://localhost:9200/_cluster/health > /dev/null; then
    print_status "Elasticsearch hoạt động ✓"
else
    print_warning "Elasticsearch chưa sẵn sàng"
fi

# Display final information
echo ""
echo "🎉 Setup hoàn tất!"
echo "=================="
echo ""
print_status "Các services đã được khởi động:"
echo "  📱 Frontend Dashboard: http://localhost:3000"
echo "  🔍 Kibana:             http://localhost:5601"
echo "  🔎 Elasticsearch:      http://localhost:9200"
echo "  🚀 Backend API:        http://localhost:5001"
echo ""
print_status "Thông tin đăng nhập:"
echo "  📧 Email:    admin@security.local"
echo "  🔑 Password: admin123"
echo ""
print_status "Các lệnh hữu ích:"
echo "  Xem logs:           $COMPOSE_CMD logs"
echo "  Restart services:   $COMPOSE_CMD restart"
echo "  Stop services:      $COMPOSE_CMD down"
echo "  Xem trạng thái:     $COMPOSE_CMD ps"
echo ""
print_warning "Lưu ý:"
echo "  - Chờ 1-2 phút để tất cả services ổn định hoàn toàn"
echo "  - Nếu gặp lỗi, kiểm tra logs: $COMPOSE_CMD logs <service_name>"
echo "  - Để demo, chạy các script trong thư mục scripts/"
echo ""
echo "Chúc bạn sử dụng vui vẻ! 🚀"