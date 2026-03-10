const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Tạo thư mục logs nếu chưa tồn tại (trước khi khởi tạo transports)
const logsDir = path.join(__dirname, '../logs');
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (error) {
  console.warn('Could not create logs directory, using console logging only:', error.message);
}

// Định nghĩa format cho log
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Tạo transports array - chỉ thêm file transports nếu có quyền ghi
const transports = [];

// Thêm file transports chỉ nếu thư mục logs tồn tại và có quyền ghi
try {
  if (fs.existsSync(logsDir) && fs.accessSync(logsDir, fs.constants.W_OK) === undefined) {
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  }
} catch (error) {
  console.warn('Could not add file transports, using console logging only:', error.message);
}

// Tạo logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'security-incident-response' },
  transports: transports,
});

// Nếu không phải production thì log ra console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
