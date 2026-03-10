const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tiêu đề sự cố là bắt buộc'],
    trim: true,
    maxlength: [200, 'Tiêu đề không được quá 200 ký tự']
  },
  description: {
    type: String,
    required: [true, 'Mô tả sự cố là bắt buộc'],
    trim: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: [true, 'Mức độ nghiêm trọng là bắt buộc'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'investigating', 'contained', 'resolved', 'closed'],
    default: 'open'
  },
  category: {
    type: String,
    enum: [
      'malware',
      'phishing',
      'data_breach',
      'ddos',
      'insider_threat',
      'physical_security',
      'network_intrusion',
      'web_application',
      'social_engineering',
      'other'
    ],
    required: [true, 'Danh mục sự cố là bắt buộc']
  },
  source: {
    type: String,
    enum: ['manual', 'automated', 'external', 'user_report'],
    default: 'manual'
  },
  affectedSystems: [{
    type: String,
    trim: true
  }],
  affectedUsers: [{
    type: String,
    trim: true
  }],
  ipAddresses: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(v);
      },
      message: 'IP address không hợp lệ'
    }
  }],
  location: {
    country: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  detectedAt: {
    type: Date,
    required: [true, 'Thời gian phát hiện là bắt buộc'],
    default: Date.now
  },
  reportedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: Date,
  estimatedImpact: {
    type: String,
    enum: ['minimal', 'minor', 'moderate', 'major', 'severe'],
    default: 'moderate'
  },
  financialImpact: {
    amount: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: String,
    trim: true
  }],
  evidence: [{
    type: {
      type: String,
      enum: ['log', 'screenshot', 'file', 'network_capture', 'other']
    },
    filename: String,
    description: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  timeline: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    action: {
      type: String,
      required: true
    },
    description: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  notes: [{
    content: {
      type: String,
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  }],
  relatedIncidents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident'
  }],
  compliance: {
    gdpr: {
      type: Boolean,
      default: false
    },
    sox: {
      type: Boolean,
      default: false
    },
    pci: {
      type: Boolean,
      default: false
    },
    hipaa: {
      type: Boolean,
      default: false
    }
  },
  lessonsLearned: String,
  recommendations: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field cho duration
incidentSchema.virtual('duration').get(function() {
  if (this.resolvedAt) {
    return this.resolvedAt - this.detectedAt;
  }
  return Date.now() - this.detectedAt;
});

// Virtual field cho isResolved
incidentSchema.virtual('isResolved').get(function() {
  return this.status === 'resolved' || this.status === 'closed';
});

// Index cho tìm kiếm và phân tích
incidentSchema.index({ severity: 1, status: 1 });
incidentSchema.index({ category: 1, detectedAt: -1 });
incidentSchema.index({ assignedTo: 1, status: 1 });
incidentSchema.index({ detectedAt: -1 });
incidentSchema.index({ 'location.country': 1, 'location.city': 1 });
incidentSchema.index({ tags: 1 });

// Middleware trước khi save - cập nhật timeline
incidentSchema.pre('save', function(next) {
  if (this.isNew) {
    this.timeline.push({
      action: 'incident_created',
      description: 'Sự cố được tạo',
      user: this.createdBy
    });
  } else if (this.isModified('status')) {
    this.timeline.push({
      action: 'status_changed',
      description: `Trạng thái thay đổi thành: ${this.status}`,
      user: this.updatedBy
    });
  }
  next();
});

// Static method để tìm incidents theo severity
incidentSchema.statics.findBySeverity = function(severity) {
  return this.find({ severity });
};

// Static method để tìm open incidents
incidentSchema.statics.findOpen = function() {
  return this.find({ status: { $in: ['open', 'investigating'] } });
};

// Static method để tìm incidents trong khoảng thời gian
incidentSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    detectedAt: {
      $gte: startDate,
      $lte: endDate
    }
  });
};

// Method để thêm note
incidentSchema.methods.addNote = function(content, author, isPrivate = false) {
  this.notes.push({
    content,
    author,
    isPrivate
  });
  return this.save();
};

// Method để update status
incidentSchema.methods.updateStatus = function(newStatus, updatedBy) {
  this.status = newStatus;
  this.updatedBy = updatedBy;
  
  if (newStatus === 'resolved' || newStatus === 'closed') {
    this.resolvedAt = Date.now();
  }
  
  return this.save();
};

module.exports = mongoose.model('Incident', incidentSchema);
