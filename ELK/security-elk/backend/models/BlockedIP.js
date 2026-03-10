const mongoose = require('mongoose');

const blockedIpSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(v);
      },
      message: 'IP address không hợp lệ'
    }
  },
  reason: {
    type: String,
    trim: true,
    default: ''
  },
  blockedAt: {
    type: Date,
    default: Date.now
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

blockedIpSchema.index({ ip: 1 }, { unique: true });

module.exports = mongoose.model('BlockedIP', blockedIpSchema);


