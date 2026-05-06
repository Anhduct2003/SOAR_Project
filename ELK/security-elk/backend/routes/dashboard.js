const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Incident = require('../models/Incident');
const Alert = require('../models/Alert');
const mongoose = require('mongoose');

const DASHBOARD_TIMEZONE = process.env.DASHBOARD_TIMEZONE || 'Asia/Bangkok';

const formatHourBucket = (date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DASHBOARD_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    hourCycle: 'h23'
  }).formatToParts(date);

  const get = (type) => parts.find((part) => part.type === type)?.value;
  const hour = get('hour') === '24' ? '00' : get('hour');

  return {
    key: `${get('year')}-${get('month')}-${get('day')} ${hour}:00`,
    name: `${hour}:00`
  };
};

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
            activeLow: { $sum: { $cond: [{ $and: [{ $eq: ['$severity', 'low'] }, { $not: { $in: ['$status', ['resolved', 'closed']] } }] }, 1, 0] } },
            activeMedium: { $sum: { $cond: [{ $and: [{ $eq: ['$severity', 'medium'] }, { $not: { $in: ['$status', ['resolved', 'closed']] } }] }, 1, 0] } },
            activeHigh: { $sum: { $cond: [{ $and: [{ $eq: ['$severity', 'high'] }, { $not: { $in: ['$status', ['resolved', 'closed']] } }] }, 1, 0] } },
            activeCritical: { $sum: { $cond: [{ $and: [{ $eq: ['$severity', 'critical'] }, { $not: { $in: ['$status', ['resolved', 'closed']] } }] }, 1, 0] } },
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
      critical: 0, activeLow: 0, activeMedium: 0, activeHigh: 0,
      activeCritical: 0, last24Hours: 0, today: 0,
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
      activeSeverity: {
        low: overview.activeLow,
        medium: overview.activeMedium,
        high: overview.activeHigh,
        critical: overview.activeCritical,
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
      .select('title description severity status category createdAt affectedSystems location')
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

// Get incident trends for the last 24 hours
router.get('/trend', protect, async (req, res) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const trends = await Incident.aggregate([
      {
        $match: {
          createdAt: { $gte: last24Hours }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d %H:00",
              date: "$createdAt",
              timezone: DASHBOARD_TIMEZONE
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Fill in missing hours
    const result = [];
    for (let i = 23; i >= 0; i--) {
      const d = new Date(Date.now() - i * 60 * 60 * 1000);
      const hourBucket = formatHourBucket(d);
      
      const found = trends.find(t => t._id === hourBucket.key);
      result.push({
        name: hourBucket.name,
        val: found ? found.count : 0
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get top attackers from alerts
router.get('/top-attackers', protect, async (req, res) => {
  try {
    const attackers = await Alert.aggregate([
      {
        $match: {
          sourceIp: { $exists: true, $ne: null, $ne: "" }
        }
      },
      {
        $group: {
          _id: "$sourceIp",
          count: { $sum: 1 },
          risk: {
            $max: {
              $switch: {
                branches: [
                  { case: { $eq: ["$severity", "critical"] }, then: 4 },
                  { case: { $eq: ["$severity", "high"] }, then: 3 },
                  { case: { $eq: ["$severity", "medium"] }, then: 2 },
                  { case: { $eq: ["$severity", "low"] }, then: 1 }
                ],
                default: 0
              }
            }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const mappedAttackers = attackers.map(a => ({
      ip: a._id,
      count: a.count,
      risk: a.risk === 4 ? 'critical' : a.risk === 3 ? 'high' : a.risk === 2 ? 'medium' : 'low'
    }));

    res.json({
      success: true,
      data: mappedAttackers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
