const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tiêu đề alert là bắt buộc'],
    trim: true,
    maxlength: [200, 'Tiêu đề không được quá 200 ký tự'],
  },
  message: {
    type: String,
    required: [true, 'Nội dung alert là bắt buộc'],
    trim: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: [true, 'Mức độ nghiêm trọng là bắt buộc'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['new', 'acknowledged', 'resolved', 'ignored'],
    default: 'new',
  },
  source: {
    type: String,
    trim: true,
  },
  sourceIp: {
    type: String,
    validate: {
      validator: function (v) {
        if (!v) return true; // Allow empty
        return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(v);
      },
      message: 'IP address không hợp lệ',
    },
  },
  timestamp: {
    type: Date,
    required: [true, 'Thời gian alert là bắt buộc'],
    default: Date.now,
  },
  acknowledged: {
    type: Boolean,
    default: false,
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  acknowledgedAt: Date,
  relatedIncident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
alertSchema.index({ severity: 1 });
alertSchema.index({ status: 1 });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ source: 1 });
alertSchema.index({ timestamp: -1 });

// TTL index: tự động xóa alerts sau 90 ngày
alertSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static method để tìm alerts chưa acknowledge
alertSchema.statics.findUnacknowledged = function () {
  return this.find({ acknowledged: false });
};

// Static method để tìm alerts theo thời gian
alertSchema.statics.findByDateRange = function (startDate, endDate) {
  return this.find({
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  });
};

// Method để acknowledge alert
alertSchema.methods.acknowledge = function (userId) {
  this.acknowledged = true;
  this.acknowledgedBy = userId;
  this.acknowledgedAt = Date.now();
  this.status = 'acknowledged';
  return this.save();
};

module.exports = mongoose.model('Alert', alertSchema);
