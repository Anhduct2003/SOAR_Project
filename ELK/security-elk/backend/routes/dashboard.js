const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Incident = require('../models/Incident');

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Lấy thống kê dashboard
 *     description: Trả về thống kê tổng quan về incidents, severity, categories và trends
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê dashboard thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DashboardStats'
 *             example:
 *               success: true
 *               data:
 *                 overview:
 *                   totalIncidents: 13
 *                   openIncidents: 12
 *                   investigatingIncidents: 1
 *                   containedIncidents: 0
 *                   resolvedIncidents: 0
 *                   closedIncidents: 0
 *                   recentIncidents: 11
 *                   todayIncidents: 11
 *                   avgResolutionTime: 0
 *                 severity:
 *                   low: 2
 *                   medium: 6
 *                   high: 3
 *                   critical: 2
 *                 categories:
 *                   malware: 2
 *                   phishing: 2
 *                   network_intrusion: 2
 *                   authentication: 1
 *                 trends:
 *                   last24Hours: 11
 *                   today: 11
 *       401:
 *         description: Token không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Lỗi server khi tải thống kê
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Get dashboard statistics
router.get('/stats', protect, async (req, res) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Single aggregation pipeline replaces 9+ separate countDocuments() calls
    const [statsResult, resolvedIncidentsWithDates] = await Promise.all([
      Incident.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
            investigating: { $sum: { $cond: [{ $eq: ['$status', 'investigating'] }, 1, 0] } },
            contained: { $sum: { $cond: [{ $eq: ['$status', 'contained'] }, 1, 0] } },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
            closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
            low: { $sum: { $cond: [{ $eq: ['$severity', 'low'] }, 1, 0] } },
            medium: { $sum: { $cond: [{ $eq: ['$severity', 'medium'] }, 1, 0] } },
            high: { $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] } },
            critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
            last24Hours: { $sum: { $cond: [{ $gte: ['$createdAt', last24Hours] }, 1, 0] } },
            today: { $sum: { $cond: [{ $gte: ['$createdAt', today] }, 1, 0] } },
          }
        }
      ]),
      // Resolution time calculation (separate query since it needs date arithmetic)
      Incident.find({ status: 'resolved', resolvedAt: { $exists: true } })
        .select('createdAt resolvedAt')
        .lean(),
    ]);

    const overview = statsResult[0] || {
      total: 0, open: 0, investigating: 0, contained: 0,
      resolved: 0, closed: 0, low: 0, medium: 0, high: 0,
      critical: 0, last24Hours: 0, today: 0,
    };

    // Category stats (separate aggregation since it needs different grouping)
    const categoryStats = await Incident.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    let avgResolutionTime = 0;
    if (resolvedIncidentsWithDates.length > 0) {
      const totalResolutionTime = resolvedIncidentsWithDates.reduce((sum, incident) => {
        return sum + (new Date(incident.resolvedAt) - new Date(incident.createdAt));
      }, 0);
      avgResolutionTime = Math.round(totalResolutionTime / resolvedIncidentsWithDates.length / (1000 * 60 * 60)); // hours
    }

    const stats = {
      overview: {
        totalIncidents: overview.total,
        openIncidents: overview.open,
        investigatingIncidents: overview.investigating,
        containedIncidents: overview.contained,
        resolvedIncidents: overview.resolved,
        closedIncidents: overview.closed,
        recentIncidents: overview.last24Hours,
        todayIncidents: overview.today,
        avgResolutionTime,
      },
      severity: {
        low: overview.low,
        medium: overview.medium,
        high: overview.high,
        critical: overview.critical,
      },
      categories: categoryStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      trends: {
        last24Hours: overview.last24Hours,
        today: overview.today,
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải thống kê dashboard',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/dashboard/recent-incidents:
 *   get:
 *     tags: [Dashboard]
 *     summary: Lấy incidents gần đây
 *     description: Trả về danh sách incidents gần đây với thông tin cơ bản
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *         description: Số lượng incidents muốn lấy
 *         example: 5
 *     responses:
 *       200:
 *         description: Danh sách incidents gần đây
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
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "60b8d8f8e1b2c1234567890a"
 *                       title:
 *                         type: string
 *                         example: "Phát hiện malware trên server"
 *                       description:
 *                         type: string
 *                         example: "Phát hiện file độc hại..."
 *                       severity:
 *                         type: string
 *                         enum: [low, medium, high, critical]
 *                         example: "high"
 *                       status:
 *                         type: string
 *                         enum: [open, investigating, contained, resolved, closed]
 *                         example: "investigating"
 *                       category:
 *                         type: string
 *                         example: "malware"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-09-04T08:30:00.000Z"
 *                       affectedSystems:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["web-server-01"]
 *                       createdBy:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "John Doe"
 *                           email:
 *                             type: string
 *                             example: "john.doe@company.com"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Get recent incidents for dashboard
router.get('/recent-incidents', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const recentIncidents = await Incident.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('title description severity status category createdAt affectedSystems')
      .populate('createdBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: recentIncidents
    });

  } catch (error) {
    console.error('Error fetching recent incidents:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải sự cố gần đây',
      error: error.message
    });
  }
});

module.exports = router;
