FROM node:18-alpine

# Tạo thư mục làm việc
WORKDIR /app

# Copy package files
COPY package*.json ./

# Cài đặt dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Tạo user không phải root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Tạo thư mục logs và cấp quyền
RUN mkdir -p /app/logs

# Thay đổi quyền sở hữu
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["npm", "start"]
