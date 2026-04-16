const express = require('express');
const Joi = require('joi');
const mongoose = require('mongoose');
const Department = require('../models/Department');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const SORT_FIELDS = new Set(['name', 'code', 'createdAt', 'updatedAt', 'sortOrder']);

const normalizeDepartmentName = (value = '') => value.trim().replace(/\s+/g, ' ');

const generateDepartmentCode = (value = '') =>
  normalizeDepartmentName(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

const isValidObjectId = (value) => !value || mongoose.Types.ObjectId.isValid(value);

const createSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  code: Joi.string().trim().max(100).optional().allow(''),
  description: Joi.string().trim().max(500).optional().allow(''),
  manager: Joi.string().trim().optional().allow(null, ''),
  parentDepartment: Joi.string().trim().optional().allow(null, ''),
  isActive: Joi.boolean().optional(),
  sortOrder: Joi.number().integer().min(0).optional()
});

const updateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional(),
  code: Joi.string().trim().max(100).optional().allow(''),
  description: Joi.string().trim().max(500).optional().allow(''),
  manager: Joi.string().trim().optional().allow(null, ''),
  parentDepartment: Joi.string().trim().optional().allow(null, ''),
  isActive: Joi.boolean().optional(),
  sortOrder: Joi.number().integer().min(0).optional()
}).min(1);

const validateRequest = (schema, payload) => {
  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    return {
      error: error.details.map((detail) => detail.message)
    };
  }

  return { value };
};

const ensureManagerExists = async (managerId) => {
  if (!managerId) {
    return null;
  }

  if (!isValidObjectId(managerId)) {
    return false;
  }

  const manager = await User.findById(managerId).select('_id firstName lastName email');
  return manager || false;
};

const ensureParentDepartmentExists = async (parentDepartmentId, departmentId = null) => {
  if (!parentDepartmentId) {
    return null;
  }

  if (!isValidObjectId(parentDepartmentId)) {
    return false;
  }

  if (departmentId && String(parentDepartmentId) === String(departmentId)) {
    return 'self';
  }

  const parentDepartment = await Department.findById(parentDepartmentId).select(
    '_id name code isActive parentDepartment'
  );

  if (!parentDepartment || !parentDepartment.isActive) {
    return false;
  }

  if (!departmentId) {
    return parentDepartment;
  }

  let cursor = parentDepartment;
  const visited = new Set();

  while (cursor?.parentDepartment) {
    const nextId = String(cursor.parentDepartment);

    if (nextId === String(departmentId)) {
      return 'cycle';
    }

    if (visited.has(nextId)) {
      break;
    }

    visited.add(nextId);
    cursor = await Department.findById(nextId).select('_id parentDepartment isActive');

    if (!cursor || !cursor.isActive) {
      break;
    }
  }

  return parentDepartment;
};

const mapDepartmentResponse = (department) => ({
  id: department._id,
  name: department.name,
  code: department.code,
  description: department.description || '',
  userCount: department.userCount || 0,
  manager:
    department.manager && typeof department.manager === 'object'
      ? {
          id: department.manager._id,
          firstName: department.manager.firstName,
          lastName: department.manager.lastName,
          email: department.manager.email
        }
      : null,
  parentDepartment:
    department.parentDepartment && typeof department.parentDepartment === 'object'
      ? {
          id: department.parentDepartment._id,
          name: department.parentDepartment.name,
          code: department.parentDepartment.code,
          isActive: department.parentDepartment.isActive
        }
      : null,
  isActive: department.isActive,
  sortOrder: department.sortOrder,
  createdAt: department.createdAt,
  updatedAt: department.updatedAt
});

router.use(protect, authorize('admin'));

router.get('/', async (req, res, next) => {
  try {
    const query = {};

    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    if (req.query.q) {
      const pattern = new RegExp(req.query.q.trim(), 'i');
      query.$or = [{ name: pattern }, { code: pattern }, { description: pattern }];
    }

    const sortBy = SORT_FIELDS.has(req.query.sortBy) ? req.query.sortBy : 'sortOrder';
    const sortDir = req.query.sortDir === 'desc' ? -1 : 1;

    const departments = await Department.find(query)
      .populate('manager', 'firstName lastName email')
      .populate('parentDepartment', 'name code isActive')
      .sort({ [sortBy]: sortDir, name: 1 });

    // Lấy số lượng user cho mỗi department bằng aggregation để tối ưu hiệu năng
    const userCounts = await User.aggregate([
      { $group: { _id: '$departmentId', count: { $sum: 1 } } }
    ]);
    
    const countsMap = new Map(userCounts.map(c => [String(c._id), c.count]));

    const data = departments.map(dept => {
      const plainDept = dept.toObject();
      plainDept.userCount = countsMap.get(String(dept._id)) || 0;
      return mapDepartmentResponse(plainDept);
    });

    res.json({
      success: true,
      count: departments.length,
      data
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id).populate(
      [
        { path: 'manager', select: 'firstName lastName email' },
        { path: 'parentDepartment', select: 'name code isActive' }
      ]
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      data: mapDepartmentResponse(department)
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { error, value } = validateRequest(createSchema, req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department payload',
        errors: error
      });
    }

    const normalizedName = normalizeDepartmentName(value.name);
    const generatedCode = generateDepartmentCode(value.code || normalizedName);
    const manager = await ensureManagerExists(value.manager);
    const parentDepartment = await ensureParentDepartmentExists(value.parentDepartment);

    if (manager === false) {
      return res.status(400).json({
        success: false,
        message: 'Manager user is invalid'
      });
    }

    if (parentDepartment === false) {
      return res.status(400).json({
        success: false,
        message: 'Parent department is invalid'
      });
    }

    const department = await Department.create({
      name: normalizedName,
      code: generatedCode,
      description: value.description || '',
      manager: manager ? manager._id : null,
      parentDepartment: parentDepartment ? parentDepartment._id : null,
      isActive: value.isActive ?? true,
      sortOrder: value.sortOrder ?? 0
    });

    const populatedDepartment = await Department.findById(department._id).populate([
      { path: 'manager', select: 'firstName lastName email' },
      { path: 'parentDepartment', select: 'name code isActive' }
    ]);

    res.status(201).json({
      success: true,
      data: mapDepartmentResponse(populatedDepartment)
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { error, value } = validateRequest(updateSchema, req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department payload',
        errors: error
      });
    }

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    if (value.name !== undefined) {
      department.name = normalizeDepartmentName(value.name);
    }

    if (value.code !== undefined) {
      department.code = generateDepartmentCode(value.code || department.name);
    }

    if (value.description !== undefined) {
      department.description = value.description || '';
    }

    if (value.manager !== undefined) {
      const manager = await ensureManagerExists(value.manager);
      if (manager === false) {
        return res.status(400).json({
          success: false,
          message: 'Manager user is invalid'
        });
      }

      department.manager = manager ? manager._id : null;
    }

    if (value.parentDepartment !== undefined) {
      const parentDepartment = await ensureParentDepartmentExists(
        value.parentDepartment,
        department._id
      );

      if (parentDepartment === false) {
        return res.status(400).json({
          success: false,
          message: 'Parent department is invalid'
        });
      }

      if (parentDepartment === 'self') {
        return res.status(400).json({
          success: false,
          message: 'Department cannot be its own parent'
        });
      }

      if (parentDepartment === 'cycle') {
        return res.status(400).json({
          success: false,
          message: 'Department hierarchy cannot contain cycles'
        });
      }

      department.parentDepartment = parentDepartment ? parentDepartment._id : null;
    }

    if (value.isActive !== undefined) {
      department.isActive = value.isActive;
    }

    if (value.sortOrder !== undefined) {
      department.sortOrder = value.sortOrder;
    }

    await department.save();

    const populatedDepartment = await Department.findById(department._id).populate([
      { path: 'manager', select: 'firstName lastName email' },
      { path: 'parentDepartment', select: 'name code isActive' }
    ]);

    res.json({
      success: true,
      data: mapDepartmentResponse(populatedDepartment)
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id).populate(
      [
        { path: 'manager', select: 'firstName lastName email' },
        { path: 'parentDepartment', select: 'name code isActive' }
      ]
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const activeChildren = await Department.countDocuments({
      parentDepartment: department._id,
      isActive: true
    });

    if (activeChildren > 0) {
      return res.status(400).json({
        success: false,
        message: 'Department has active child departments'
      });
    }

    department.isActive = false;
    await department.save();

    res.json({
      success: true,
      data: mapDepartmentResponse(department)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
