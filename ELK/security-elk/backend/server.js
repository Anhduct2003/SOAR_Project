const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
// Swagger disabled for now - see /backend/API_DOCUMENTATION.md
// const swaggerUi = require('swagger-ui-express');
// const swaggerSpec = require('./swagger');
require('dotenv').config();

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');
const alertRoutes = require('./routes/alerts');
const dashboardRoutes = require('./routes/dashboard');
const elasticsearchRoutes = require('./routes/elasticsearch');

const app = express();
// Tin tưởng proxy để lấy chính xác IP người dùng
app.set('trust proxy', true);

const server = http.createServer(app);

// Allow all origins for demo purposes
const parseAllowedOrigins = () => {
  return ['*']; // Allow all origins for demo
};

const allowedOrigins = parseAllowedOrigins();

const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins for demo
    methods: ["GET", "POST", "OPTIONS"],
    credentials: false // Set to false when using wildcard origin
  },
  transports: ['websocket', 'polling']
});

// Middleware bảo mật - Disabled for demo
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for demo
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // giới hạn 100 requests per windowMs
  message: 'Quá nhiều requests từ IP này, vui lòng thử lại sau 15 phút.'
});
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Quá nhiều yêu cầu đăng nhập/tạo tài khoản, thử lại sau.'
});
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Middleware
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(cors({
  origin: "*", // Allow all origins for demo
  credentials: false, // Set to false when using wildcard origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static('public'));

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check endpoint
 *     description: Kiểm tra trạng thái server và thời gian uptime
 *     responses:
 *       200:
 *         description: Server đang hoạt động bình thường
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-09-04T08:30:00.000Z"
 *                 uptime:
 *                   type: number
 *                   example: 3600.5
 *                   description: "Server uptime in seconds"
 *                 environment:
 *                   type: string
 *                   example: "development"
 */
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Documentation endpoint (serves static file)
app.get('/api-docs', (req, res) => {
  res.redirect('/swagger.html');
});

// Swagger HTML Documentation
app.get('/docs', (req, res) => {
  res.redirect('/swagger.html');
});

// Swagger Documentation - See API_DOCUMENTATION.md for full details
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
//   explorer: true,
//   customCss: '.swagger-ui .topbar { display: none }',
//   customSiteTitle: 'Security Incident Response API Documentation',
//   customfavIcon: '/favicon.ico',
//   swaggerOptions: {
//     persistAuthorization: true
//   }
// }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/elasticsearch', elasticsearchRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('join-dashboard', (data) => {
    socket.join('dashboard');
    logger.info(`Client ${socket.id} joined dashboard`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint không tồn tại'
  });
});

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/security_incidents', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  logger.info('Kết nối MongoDB thành công');
})
.catch((err) => {
  logger.error('Lỗi kết nối MongoDB:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    mongoose.connection.close();
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    mongoose.connection.close();
  });
});

// Export io instance để sử dụng trong các module khác
app.set('io', io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Server đang chạy trên port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, server, io };
