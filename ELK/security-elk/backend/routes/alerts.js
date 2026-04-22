const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Incident = require('../models/Incident');
const User = require('../models/User');
const https = require('https');
const BlockedIP = require('../models/BlockedIP');

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     tags: [Alerts]
 *     summary: Lấy danh sách alerts
 *     description: Trả về danh sách security alerts (tính năng chưa implement đầy đủ)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách alerts (hiện tại trống)
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
 *                     type: object
 *                   example: []
 *       401:
 *         description: Token không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// GET /api/alerts
router.get('/', protect, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const severities = (req.query.severity || 'high,critical')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const since = req.query.since ? new Date(req.query.since) : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const query = {
      severity: { $in: severities },
      createdAt: { $gte: since }
    };

    const incidents = await Incident.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('title severity status category createdAt source')
      .lean();

    const data = incidents.map((i) => ({
      id: i._id,
      type: 'incident',
      title: i.title,
      severity: i.severity,
      status: i.status,
      category: i.category,
      source: i.source,
      createdAt: i.createdAt
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Không thể tải alerts', error: error.message });
  }
});

/**
 * Webhook để nhận alert từ ElastAlert và tự động tạo Incident
 * Không yêu cầu auth vì được gọi nội bộ trong docker network
 * POST /api/alerts/webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body || {};

    // Map dữ liệu cơ bản
    const title = payload.title || payload.rule_name || 'Security Alert';
    const description = payload.description || payload.alert_text || 'Alert from ElastAlert';
    const severity = (payload.severity || 'high').toLowerCase();
    const category = payload.category || 'network_intrusion';

    // Thu thập IPs nếu có
    const ipCandidates = [];
    if (Array.isArray(payload.ipAddresses)) ipCandidates.push(...payload.ipAddresses);
    if (payload.source_ip) ipCandidates.push(payload.source_ip);
    if (payload['source.ip']) ipCandidates.push(payload['source.ip']);
    if (payload.query_key) ipCandidates.push(payload.query_key);
    const uniqueIps = [...new Set(ipCandidates.filter(Boolean))];

    // Kiểm tra blocklist: nếu tất cả IP nằm trong blocklist, đánh dấu incident là contained và không gửi Telegram
    let isFullyBlocked = false;
    if (uniqueIps.length > 0) {
      const blocked = await BlockedIP.find({ ip: { $in: uniqueIps } }).select('ip').lean();
      const blockedSet = new Set(blocked.map(b => b.ip));
      isFullyBlocked = uniqueIps.every(ip => blockedSet.has(ip));
    }

    // Resolve default owner (createdBy)
    let ownerId = (req.user && req.user.id) || process.env.DEFAULT_INCIDENT_OWNER_ID;
    if (!ownerId) {
      // try find admin user as fallback
      const adminUser = await User.findOne({ email: 'admin@security.local' }).select('_id').lean();
      if (adminUser) ownerId = adminUser._id;
    }

    const incident = await Incident.create({
      title,
      description,
      severity: ['low', 'medium', 'high', 'critical'].includes(severity) ? severity : 'high',
      category,
      source: 'automated',
      ipAddresses: uniqueIps,
      detectedAt: new Date(),
      createdBy: ownerId
    });

    // Emit realtime tới dashboard
    try {
      const io = req.app.get('io');
      io.to('dashboard').emit('incident_created', {
        id: incident._id,
        title: incident.title,
        severity: incident.severity,
        category: incident.category,
        createdAt: incident.createdAt
      });
    } catch (e) { }

    // Telegram notification (nếu cấu hình)
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (botToken && chatId && !isFullyBlocked) {
      const text = encodeURIComponent(
        `🚨 Incident: ${title}\nSeverity: ${severity}\nCategory: ${category}\nIPs: ${uniqueIps.join(', ') || 'N/A'}\nTime: ${new Date().toISOString()}`
      );
      const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${text}`;
      https.get(tgUrl).on('error', () => { });
    }

    res.json({ success: true, id: incident._id });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Webhook error', error: error.message });
  }
});

module.exports = router;
