const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const { protect, authorize } = require('../middleware/auth');
const { validateLogin, validateRegister, validateChangePassword } = require('../middleware/validator');
const logger = require('../utils/logger');

const router = express.Router();
const departmentPopulate = {
  path: 'departmentId',
  select: 'name code isActive'
};

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const toDepartmentSummary = (departmentRef) => {
  if (!departmentRef || typeof departmentRef !== 'object' || Array.isArray(departmentRef)) {
    return null;
  }

  if (!departmentRef.name) {
    return null;
  }

  return {
    id: departmentRef._id,
    name: departmentRef.name,
    code: departmentRef.code,
    isActive: departmentRef.isActive
  };
};

const mapUserResponse = (user) => {
  const departmentSummary = toDepartmentSummary(user.departmentId);
  const resolvedDepartmentId = departmentSummary?.id || user.departmentId || null;
  const resolvedDepartmentName = departmentSummary?.name || user.department || null;

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    department: resolvedDepartmentName,
    departmentId: resolvedDepartmentId,
    departmentDetails: departmentSummary,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

const resolveDepartmentAssignment = async (departmentId) => {
  if (!departmentId) {
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    return false;
  }

  return Department.findOne({
    _id: departmentId,
    isActive: true
  });
};

// @desc    Đăng ký user mới
// @route   POST /api/auth/register
// @access  Public
router.post('/register', validateRegister, async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName, department, departmentId, role } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    let resolvedDepartmentId = null;
    let resolvedDepartmentName = department;

    if (departmentId) {
      const selectedDepartment = await resolveDepartmentAssignment(departmentId);
      if (selectedDepartment === false) {
        return res.status(400).json({ success: false, message: 'Department ID is invalid' });
      }
      if (!selectedDepartment) {
        return res.status(400).json({ success: false, message: 'Department not found or inactive' });
      }
      resolvedDepartmentId = selectedDepartment._id;
      resolvedDepartmentName = selectedDepartment.name;
    }

    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      department: resolvedDepartmentName,
      departmentId: resolvedDepartmentId,
      role: role || 'viewer'
    });

    const token = generateToken(user._id);
    logger.info(`User mới được tạo: ${user.email}`);

    res.status(201).json({
      success: true,
      token,
      user: mapUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Đăng nhập user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password').populate(departmentPopulate);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      logger.warn(`Failed login attempt for user ${email} from IP ${clientIp}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account has been disabled' });
    }

    // Cập nhật last login bằng findByIdAndUpdate để tránh trigger save middleware (double băm)
    try {
      await User.findByIdAndUpdate(user._id, { $set: { lastLogin: Date.now() } });
    } catch (saveError) {
      console.error('Lỗi khi cập nhật last login:', saveError);
    }

    const token = generateToken(user._id);
    logger.info(`User đăng nhập: ${user.email}`);

    res.json({
      success: true,
      token,
      user: mapUserResponse(user)
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
    const user = await User.findById(req.user.id).populate(departmentPopulate);
    res.json({ success: true, user: mapUserResponse(user) });
  } catch (error) {
    next(error);
  }
});

// @desc    Đổi password (Dành cho bản thân user)
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, validateChangePassword, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();
    logger.info(`User đổi password: ${user.email}`);

    res.json({ success: true, message: 'Password đã được thay đổi thành công' });
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
    
    // Tìm kiếm theo tên hoặc email nếu có params search
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { firstName: { $regex: searchRegex } },
        { lastName: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { username: { $regex: searchRegex } }
      ];
    }

    if (req.query.role) query.role = req.query.role;
    if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
    if (req.query.departmentId && mongoose.Types.ObjectId.isValid(req.query.departmentId)) {
      query.departmentId = req.query.departmentId;
    }

    const users = await User.find(query)
      .select('-password')
      .populate(departmentPopulate)
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      data: users.map(mapUserResponse)
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Cập nhật user (Admin only) - Bao gồm cả Reset Password
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
router.put('/users/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    console.log(`[DEBUG] Admin updating user ID: ${req.params.id}`);
    console.log(`[DEBUG] Payload:`, { ...req.body, password: req.body.password ? '********' : '[SKIPPED]' });

    // Cần select password để Mongoose quản lý trạng thái modified tốt hơn
    let user = await User.findById(req.params.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User không tồn tại' });
    }

    if (hasOwn(req.body, 'firstName')) user.firstName = req.body.firstName;
    if (hasOwn(req.body, 'lastName')) user.lastName = req.body.lastName;
    if (hasOwn(req.body, 'email')) user.email = req.body.email;
    if (hasOwn(req.body, 'role')) user.role = req.body.role;
    if (hasOwn(req.body, 'isActive')) user.isActive = req.body.isActive;
    
    // reset password nếu có dữ liệu mới
    if (hasOwn(req.body, 'password') && req.body.password) {
      console.log(`[DEBUG] Setting NEW password for ${user.email}`);
      user.password = req.body.password;
    }

    if (hasOwn(req.body, 'departmentId')) {
      const normalizedDeptId = req.body.departmentId || null;
      if (!normalizedDeptId) {
        user.departmentId = null;
        user.department = null;
      } else {
        const department = await resolveDepartmentAssignment(normalizedDeptId);
        if (department) {
          user.departmentId = department._id;
          user.department = department.name;
        }
      }
    }

    await user.save();
    console.log(`[DEBUG] User ${user.email} saved successfully.`);

    user = await User.findById(user._id).populate(departmentPopulate);
    logger.info(`Admin cập nhật user: ${user.email}`);

    res.json({ success: true, data: mapUserResponse(user) });
  } catch (error) {
    console.error(`[DEBUG] Error updating user:`, error);
    next(error);
  }
});

module.exports = router;
