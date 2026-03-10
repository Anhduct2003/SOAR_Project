const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username là bắt buộc'],
    unique: true,
    trim: true,
    minlength: [3, 'Username phải có ít nhất 3 ký tự'],
    maxlength: [50, 'Username không được quá 50 ký tự']
  },
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    unique: true,
    lowercase: true,
    match: [
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/,
      'Email không hợp lệ'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password là bắt buộc'],
    minlength: [6, 'Password phải có ít nhất 6 ký tự'],
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'analyst', 'viewer'],
    default: 'viewer'
  },
  firstName: {
    type: String,
    required: [true, 'Tên là bắt buộc'],
    trim: true,
    maxlength: [50, 'Tên không được quá 50 ký tự']
  },
  lastName: {
    type: String,
    required: [true, 'Họ là bắt buộc'],
    trim: true,
    maxlength: [50, 'Họ không được quá 50 ký tự']
  },
  department: {
    type: String,
    trim: true,
    maxlength: [100, 'Phòng ban không được quá 100 ký tự']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  twoFactorSecret: String,
  twoFactorEnabled: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field cho full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Index cho tìm kiếm
userSchema.index({ email: 1, username: 1 });
userSchema.index({ role: 1, isActive: 1 });

// Middleware trước khi save - hash password
userSchema.pre('save', async function(next) {
  // Chỉ hash password nếu nó được thay đổi
  if (!this.isModified('password')) return next();

  try {
    // Hash password với salt rounds = 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware trước khi save - cập nhật passwordChangedAt
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Method để so sánh password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method để kiểm tra password có thay đổi sau khi token được tạo
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Static method để tìm user theo email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method để tìm active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

module.exports = mongoose.model('User', userSchema);
