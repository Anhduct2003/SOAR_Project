const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const BlockedIP = require('../models/BlockedIP');
const { protect } = require('../middleware/auth');

// Simple validation helpers (avoid extra deps)
const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'];
const VALID_STATUS = ['open', 'investigating', 'contained', 'resolved', 'closed'];
const VALID_CATEGORIES = [
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
];

function validateIncidentBody(body) {
  const errors = [];
  if (!body.title || typeof body.title !== 'string' || body.title.length > 200) {
    errors.push('title không hợp lệ');
  }
  if (!body.description || typeof body.description !== 'string') {
    errors.push('description không hợp lệ');
  }
  if (!body.severity || !VALID_SEVERITIES.includes(body.severity)) {
    errors.push('severity không hợp lệ');
  }
  if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
    errors.push('category không hợp lệ');
  }
  if (body.status && !VALID_STATUS.includes(body.status)) {
    errors.push('status không hợp lệ');
  }
  if (body.ipAddresses && !Array.isArray(body.ipAddresses)) {
    errors.push('ipAddresses phải là mảng');
  }
  return errors;
}

/**
 * @swagger
 * /api/incidents:
 *   get:
 *     tags: [Incidents]
 *     summary: Lấy danh sách incidents
 *     description: Trả về danh sách 50 incidents gần nhất, sắp xếp theo thời gian tạo
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách incidents thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Incident'
 *       401:
 *         description: Token không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// GET /api/incidents
router.get('/', protect, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.since) {
      const since = new Date(req.query.since);
      if (!isNaN(since.getTime())) {
        filter.createdAt = { $gte: since };
      }
    }
    if (req.query.q) {
      const q = String(req.query.q).trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      ];
    }

    const sortField = ['createdAt','severity','status','category','detectedAt'].includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const sortDir = req.query.sortDir === 'asc' ? 1 : -1;

    const [incidents, total] = await Promise.all([
      Incident.find(filter).sort({ [sortField]: sortDir }).skip(skip).limit(limit),
      Incident.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: incidents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/incidents:
 *   post:
 *     tags: [Incidents]
 *     summary: Tạo incident mới
 *     description: Tạo một security incident mới trong hệ thống
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - severity
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 example: "Phát hiện malware trên server production"
 *               description:
 *                 type: string
 *                 example: "Phát hiện file độc hại trojan.exe trên server web chính"
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 example: "high"
 *               status:
 *                 type: string
 *                 enum: [open, investigating, contained, resolved, closed]
 *                 default: "open"
 *                 example: "open"
 *               category:
 *                 type: string
 *                 enum: [malware, phishing, data_breach, ddos, insider_threat, physical_security, network_intrusion, web_application, social_engineering, other]
 *                 example: "malware"
 *               affectedSystems:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["web-server-01", "database-server-02"]
 *               affectedUsers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["john.doe@company.com"]
 *               ipAddresses:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: ipv4
 *                 example: ["192.168.1.100"]
 *     responses:
 *       201:
 *         description: Incident được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Incident'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// POST /api/incidents
router.post('/', protect, async (req, res, next) => {
  try {
    const validationErrors = validateIncidentBody(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, message: validationErrors.join(', ') });
    }

    const incidentData = {
      ...req.body,
      createdBy: req.user._id
    };
    const incident = new Incident(incidentData);
    await incident.save();

    // Emit realtime event to dashboard room
    const io = req.app.get('io');
    if (io) {
      io.to('dashboard').emit('incidentCreated', incident);
    }

    res.status(201).json({ success: true, data: incident });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/incidents/{id}:
 *   put:
 *     tags: [Incidents]
 *     summary: Cập nhật incident
 *     description: Cập nhật trường status, severity, category, description, assignedTo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy incident
 */
router.put('/:id', protect, async (req, res, next) => {
  try {
    const updates = {};
    const { status, severity, category, description, assignedTo } = req.body;

    if (status) {
      if (!VALID_STATUS.includes(status)) {
        return res.status(400).json({ success: false, message: 'status không hợp lệ' });
      }
      updates.status = status;
    }
    if (severity) {
      if (!VALID_SEVERITIES.includes(severity)) {
        return res.status(400).json({ success: false, message: 'severity không hợp lệ' });
      }
      updates.severity = severity;
    }
    if (category) {
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ success: false, message: 'category không hợp lệ' });
      }
      updates.category = category;
    }
    if (typeof description === 'string') {
      updates.description = description;
    }
    if (assignedTo) {
      updates.assignedTo = assignedTo;
    }

    updates.updatedBy = req.user._id;

    const incident = await Incident.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident không tồn tại' });
    }

    // Emit realtime update
    const io = req.app.get('io');
    if (io) {
      io.to('dashboard').emit('incidentUpdated', incident);
    }

    res.json({ success: true, data: incident });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
 
/**
 * @swagger
 * /api/incidents/bulk-status:
 *   put:
 *     tags: [Incidents]
 *     summary: Cập nhật trạng thái hàng loạt
 *     description: Cập nhật field status cho nhiều incidents theo danh sách id
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [open, investigating, contained, resolved, closed]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/bulk-status', protect, async (req, res, next) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids không hợp lệ' });
    }
    const VALID_STATUS = ['open','investigating','contained','resolved','closed'];
    if (!VALID_STATUS.includes(status)) {
      return res.status(400).json({ success: false, message: 'status không hợp lệ' });
    }
    const result = await Incident.updateMany(
      { _id: { $in: ids } },
      { $set: { status, updatedBy: req.user._id, resolvedAt: (status === 'resolved' || status === 'closed') ? Date.now() : undefined } }
    );

    const io = req.app.get('io');
    if (io) {
      io.to('dashboard').emit('incidentBulkUpdated', { ids, status });
    }

    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    next(err);
  }
});

// POST /api/incidents/block-ip
router.post('/block-ip', protect, async (req, res, next) => {
  try {
    const { ip, reason } = req.body || {};
    if (!ip) return res.status(400).json({ success: false, message: 'ip là bắt buộc' });
    const doc = await BlockedIP.findOneAndUpdate(
      { ip },
      { ip, reason: reason || '', blockedBy: req.user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/incidents/block-ip/:ip
router.delete('/block-ip/:ip', protect, async (req, res, next) => {
  try {
    const { ip } = req.params;
    const result = await BlockedIP.deleteOne({ ip });
    return res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    next(err);
  }
});
