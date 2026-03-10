const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * /api/elasticsearch/ping:
 *   get:
 *     tags: [Elasticsearch]
 *     summary: Ping Elasticsearch service
 *     description: Kiểm tra kết nối với Elasticsearch (endpoint cơ bản)
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
 *         description: Token không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

router.get('/ping', protect, async (req, res) => {
  res.json({ success: true, message: 'ok' });
});

module.exports = router;
