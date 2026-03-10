const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Lấy token từ header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      if (!process.env.JWT_SECRET) {
        logger.error('JWT_SECRET is not set');
        return res.status(500).json({ success: false, message: 'Server misconfiguration' });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Lấy thông tin user từ token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Token không hợp lệ'
        });
      }

      next();
    } catch (error) {
      logger.error('Token verification failed:', error);
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Không có token, truy cập bị từ chối'
    });
  }
};

// Middleware cho role-based access
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} không có quyền truy cập resource này`
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
