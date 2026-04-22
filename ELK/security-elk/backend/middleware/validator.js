const Joi = require('joi');

// Validation middleware for login
const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })  // Allow emails without TLD for testing
      .required()
      .max(255)
      .trim()
      .messages({
        'string.email': 'Email không hợp lệ',
        'string.empty': 'Email không được để trống',
        'any.required': 'Email là bắt buộc'
      }),
    password: Joi.string()
      .required()
      .min(6)
      .max(128)
      .messages({
        'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
        'string.max': 'Mật khẩu không được quá 128 ký tự',
        'any.required': 'Mật khẩu là bắt buộc'
      })
  });

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: messages
    });
  }

  next();
};

// Validation middleware for registration
const validateRegister = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string()
      .required()
      .min(3)
      .max(50)
      .trim()
      .alphanum()
      .messages({
        'string.min': 'Username phải có ít nhất 3 ký tự',
        'string.max': 'Username không được quá 50 ký tự',
        'string.alphanum': 'Username chỉ được chứa chữ và số',
        'any.required': 'Username là bắt buộc'
      }),
    email: Joi.string()
      .email()
      .required()
      .max(255)
      .trim()
      .lowercase()
      .messages({
        'string.email': 'Email không hợp lệ',
        'any.required': 'Email là bắt buộc'
      }),
    password: Joi.string()
      .required()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .messages({
        'string.min': 'Mật khẩu phải có ít nhất 8 ký tự',
        'string.max': 'Mật khẩu không được quá 128 ký tự',
        'string.pattern.base': 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
        'any.required': 'Mật khẩu là bắt buộc'
      }),
    firstName: Joi.string()
      .required()
      .min(1)
      .max(50)
      .trim()
      .messages({
        'string.min': 'Tên không được để trống',
        'any.required': 'Tên là bắt buộc'
      }),
    lastName: Joi.string()
      .required()
      .min(1)
      .max(50)
      .trim()
      .messages({
        'string.min': 'Họ không được để trống',
        'any.required': 'Họ là bắt buộc'
      }),
    department: Joi.string()
      .optional()
      .max(100)
      .trim(),
    departmentId: Joi.string()
      .optional()
      .allow(null, ''),
    role: Joi.string()
      .valid('admin', 'analyst', 'viewer')
      .default('viewer')
      .messages({
        'any.only': 'Role phải là admin, analyst hoặc viewer'
      })
  });

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: messages
    });
  }

  next();
};

// Validation middleware for creating incidents
const validateIncident = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string()
      .required()
      .min(5)
      .max(200)
      .trim()
      .messages({
        'string.min': 'Tiêu đề phải có ít nhất 5 ký tự',
        'string.max': 'Tiêu đề không được quá 200 ký tự',
        'any.required': 'Tiêu đề là bắt buộc'
      }),
    description: Joi.string()
      .required()
      .min(10)
      .max(5000)
      .trim()
      .messages({
        'string.min': 'Mô tả phải có ít nhất 10 ký tự',
        'any.required': 'Mô tả là bắt buộc'
      }),
    severity: Joi.string()
      .required()
      .valid('low', 'medium', 'high', 'critical')
      .messages({
        'any.only': 'Severity phải là low, medium, high hoặc critical',
        'any.required': 'Severity là bắt buộc'
      }),
    category: Joi.string()
      .required()
      .valid(
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
      )
      .messages({
        'any.only': 'Category không hợp lệ',
        'any.required': 'Category là bắt buộc'
      }),
    status: Joi.string()
      .optional()
      .valid('open', 'investigating', 'contained', 'resolved', 'closed')
      .default('open'),
    source: Joi.string()
      .optional()
      .valid('manual', 'automated', 'external', 'user_report')
      .default('manual'),
    affectedSystems: Joi.array()
      .items(Joi.string().trim())
      .optional(),
    affectedUsers: Joi.array()
      .items(Joi.string().email().trim())
      .optional(),
    ipAddresses: Joi.array()
      .items(
        Joi.string().ip().messages({
          'string.ip': 'IP address không hợp lệ'
        })
      )
      .optional(),
    estimatedImpact: Joi.string()
      .optional()
      .valid('minimal', 'minor', 'moderate', 'major', 'severe')
  });

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: messages
    });
  }

  next();
};

// Validation middleware for changing password
const validateChangePassword = (req, res, next) => {
  const schema = Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Mật khẩu hiện tại là bắt buộc'
      }),
    newPassword: Joi.string()
      .required()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .messages({
        'string.min': 'Mật khẩu mới phải có ít nhất 8 ký tự',
        'string.pattern.base': 'Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
        'any.required': 'Mật khẩu mới là bắt buộc'
      })
  });

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: messages
    });
  }

  next();
};

module.exports = {
  validateLogin,
  validateRegister,
  validateIncident,
  validateChangePassword
};
