/**
 * @swagger
 * /api/alerts:
 *   get:
 *     tags: [Alerts]
 *     summary: Lấy danh sách alerts
 *     description: Trả về danh sách security alerts (hiện tại trả về rỗng - chưa implement)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách alerts
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
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/elasticsearch/ping:
 *   get:
 *     tags: [Elasticsearch]
 *     summary: Ping Elasticsearch service
 *     description: Kiểm tra kết nối với Elasticsearch (cơ bản)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Elasticsearch ping thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "ok"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
