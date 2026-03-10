/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Lấy thống kê dashboard
 *     description: Trả về thống kê tổng quan về incidents và security metrics
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
 *       401:
 *         description: Unauthorized
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

/**
 * @swagger
 * /api/dashboard/recent-incidents:
 *   get:
 *     tags: [Dashboard]
 *     summary: Lấy incidents gần đây
 *     description: Trả về danh sách incidents gần đây cho dashboard
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
 *         description: Số lượng incidents muốn lấy (tối đa 50)
 *         example: 10
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
 *         description: Lỗi server khi tải incidents
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
