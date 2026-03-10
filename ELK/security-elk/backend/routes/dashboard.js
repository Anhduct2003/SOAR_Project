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
    // Get total incidents count
    const totalIncidents = await Incident.countDocuments();
    
    // Get incidents by status
    const openIncidents = await Incident.countDocuments({ status: 'open' });
    const investigatingIncidents = await Incident.countDocuments({ status: 'investigating' });
    const containedIncidents = await Incident.countDocuments({ status: 'contained' });
    const resolvedIncidents = await Incident.countDocuments({ status: 'resolved' });
    const closedIncidents = await Incident.countDocuments({ status: 'closed' });
    
    // Get incidents by severity
    const lowSeverity = await Incident.countDocuments({ severity: 'low' });
    const mediumSeverity = await Incident.countDocuments({ severity: 'medium' });
    const highSeverity = await Incident.countDocuments({ severity: 'high' });
    const criticalSeverity = await Incident.countDocuments({ severity: 'critical' });
    
    // Get incidents by category
    const categoryStats = await Incident.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get recent incidents (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentIncidents = await Incident.countDocuments({
      createdAt: { $gte: last24Hours }
    });
    
    // Get incidents created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIncidents = await Incident.countDocuments({
      createdAt: { $gte: today }
    });
    
    // Calculate resolution time average for resolved incidents
    const resolvedIncidentsWithDates = await Incident.find({
      status: 'resolved',
      resolvedAt: { $exists: true }
    }).select('createdAt resolvedAt');
    
    let avgResolutionTime = 0;
    if (resolvedIncidentsWithDates.length > 0) {
      const totalResolutionTime = resolvedIncidentsWithDates.reduce((sum, incident) => {
        return sum + (new Date(incident.resolvedAt) - new Date(incident.createdAt));
      }, 0);
      avgResolutionTime = Math.round(totalResolutionTime / resolvedIncidentsWithDates.length / (1000 * 60 * 60)); // hours
    }
    
    const stats = {
      overview: {
        totalIncidents,
        openIncidents,
        investigatingIncidents,
        containedIncidents,
        resolvedIncidents,
        closedIncidents,
        recentIncidents,
        todayIncidents,
        avgResolutionTime
      },
      severity: {
        low: lowSeverity,
        medium: mediumSeverity,
        high: highSeverity,
        critical: criticalSeverity
      },
      categories: categoryStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      trends: {
        last24Hours: recentIncidents,
        today: todayIncidents
      }
    };
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải thống kê dashboard',
      error: error.message
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
      .populate('createdBy', 'name email');
    
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
