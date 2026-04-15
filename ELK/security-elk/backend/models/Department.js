const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      maxlength: [100, 'Department name must not exceed 100 characters']
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      trim: true,
      uppercase: true,
      maxlength: [100, 'Department code must not exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must not exceed 500 characters']
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    parentDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    sortOrder: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

departmentSchema.index({ name: 1 }, { unique: true });
departmentSchema.index({ code: 1 }, { unique: true });
departmentSchema.index({ isActive: 1, sortOrder: 1, name: 1 });
departmentSchema.index({ parentDepartment: 1, isActive: 1, sortOrder: 1, name: 1 });

module.exports = mongoose.model('Department', departmentSchema);
