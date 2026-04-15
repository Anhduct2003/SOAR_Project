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
const { connectDB, disconnectDB } = require('./db');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');
const alertRoutes = require('./routes/alerts');
const dashboardRoutes = require('./routes/dashboard');
const elasticsearchRoutes = require('./routes/elasticsearch');
const healthRoutes = require('./routes/health');

const app = express();
// Tin tưởng proxy (Nginx) để lấy chính xác IP người dùng
app.set('trust proxy', 1);

const server = http.createServer(app);

// CORS Configuration - Use environment variable or default to localhost
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

logger.info(`CORS allowed origins: ${allowedOrigins.join(', ')}`);

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
  },
  transports: ['websocket', 'polling']
});

// Security Headers with Helmet - Full configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false, // Needed for some frontend features
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: true,
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
}));

// Rate limiting - Stricter for auth endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Quá nhiều requests từ IP này, vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login/register attempts per 15 minutes
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu đăng nhập/tạo tài khoản, thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful logins
});

const webhookLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // limit to 50 webhook requests per 5 minutes
  message: {
    success: false,
    message: 'Too many webhook requests'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/alerts/webhook', webhookLimiter);

// Middleware
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    const allowed = (process.env.CORS_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map(o => o.trim());

    if (allowed.indexOf(origin) !== -1 || allowed.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
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

// Configuration endpoint for dynamic documentation/frontend
app.get('/api/config', (req, res) => {
  res.json({
    apiUrl: process.env.API_URL || `${req.protocol}://${req.get('host')}`,
    nodeEnv: process.env.NODE_ENV || 'development'
  });
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
app.use('/api/health', healthRoutes);

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
connectDB();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    logger.info('Process terminated');
    await disconnectDB();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(async () => {
    logger.info('Process terminated');
    await disconnectDB();
    process.exit(0);
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
