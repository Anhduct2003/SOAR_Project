const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User là bắt buộc'],
  },
  action: {
    type: String,
    required: [true, 'Action là bắt buộc'],
    enum: [
      'login',
      'logout',
      'incident_created',
      'incident_updated',
      'incident_deleted',
      'incident_status_changed',
      'incident_bulk_updated',
      'ip_blocked',
      'ip_unblocked',
      'user_created',
      'user_updated',
      'user_deleted',
      'password_changed',
      'alert_acknowledged',
      'webhook_received',
    ],
    trim: true,
  },
  resourceType: {
    type: String,
    enum: ['incident', 'user', 'alert', 'blocked_ip'],
    trim: true,
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  description: {
    type: String,
    trim: true,
  },
  changes: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  ipAddress: {
    type: String,
    validate: {
      validator: function (v) {
        if (!v) return true;
        return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(v);
      },
      message: 'IP address không hợp lệ',
    },
  },
  userAgent: {
    type: String,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ ipAddress: 1 });

// TTL index: tự động xóa audit logs sau 180 ngày
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

// Static method để tìm audit logs theo user
auditLogSchema.statics.findByUser = function (userId) {
  return this.find({ user: userId }).sort({ timestamp: -1 });
};

// Static method để tìm audit logs theo action
auditLogSchema.statics.findByAction = function (action) {
  return this.find({ action }).sort({ timestamp: -1 });
};

// Static method để tìm audit logs theo thời gian
auditLogSchema.statics.findByDateRange = function (startDate, endDate) {
  return this.find({
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ timestamp: -1 });
};

// Static method để tìm audit logs theo resource
auditLogSchema.statics.findByResource = function (resourceType, resourceId) {
  return this.find({ resourceType, resourceId }).sort({ timestamp: -1 });
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
