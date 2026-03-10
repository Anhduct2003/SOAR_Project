const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Đăng ký user mới
 *     description: Tạo tài khoản user mới trong hệ thống
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: "analyst01"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "analyst@company.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "securepass123"
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               department:
 *                 type: string
 *                 example: "IT Security"
 *               role:
 *                 type: string
 *                 enum: [admin, analyst, viewer]
 *                 default: viewer
 *                 example: "analyst"
 *     responses:
 *       201:
 *         description: User được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: User đã tồn tại hoặc dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// @desc    Đăng ký user mới
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName, department, role } = req.body;

    // Kiểm tra user đã tồn tại
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User đã tồn tại'
      });
    }

    // Tạo user mới
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      department,
      role: role || 'viewer'
    });

    // Tạo token
    const token = generateToken(user._id);

    logger.info(`User mới được tạo: ${user.email}`);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Đăng nhập user
 *     description: Xác thực user và trả về JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@security.local"
 *                 description: "Email đăng nhập (test: admin@security.local)"
 *               password:
 *                 type: string
 *                 example: "admin123"
 *                 description: "Mật khẩu (test: admin123)"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               user:
 *                 id: "68b927048a05867f42fa3350"
 *                 username: "admin"
 *                 email: "admin@security.local"
 *                 firstName: "Admin"
 *                 lastName: "User"
 *                 role: "admin"
 *                 department: "IT Security"
 *       400:
 *         description: Thiếu email hoặc password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Thông tin đăng nhập không hợp lệ hoặc tài khoản bị vô hiệu hóa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// @desc    Đăng nhập user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email và password'
      });
    }

    // Kiểm tra user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Thông tin đăng nhập không hợp lệ'
      });
    }

    // Kiểm tra password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Thông tin đăng nhập không hợp lệ'
      });
    }

    // Kiểm tra user có active không
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa'
      });
    }

    // Cập nhật last login
    user.lastLogin = Date.now();
    await user.save();

    // Tạo token
    const token = generateToken(user._id);

    logger.info(`User đăng nhập: ${user.email}`);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Lấy thông tin user hiện tại
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Cập nhật thông tin user
// @route   PUT /api/auth/me
// @access  Private
router.put('/me', protect, async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      department: req.body.department
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Đổi password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp password hiện tại và password mới'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Kiểm tra password hiện tại
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password hiện tại không đúng'
      });
    }

    // Cập nhật password mới
    user.password = newPassword;
    await user.save();

    logger.info(`User đổi password: ${user.email}`);

    res.json({
      success: true,
      message: 'Password đã được thay đổi thành công'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Lấy danh sách users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
router.get('/users', protect, authorize('admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const query = {};
    if (req.query.role) query.role = req.query.role;
    if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';

    const users = await User.find(query)
      .select('-password')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: users
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Cập nhật user (Admin only)
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
router.put('/users/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { role, isActive, department } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, isActive, department },
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User không tồn tại'
      });
    }

    logger.info(`Admin cập nhật user: ${user.email}`);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
