/**
 * @swagger
 * /api/incidents:
 *   get:
 *     tags: [Incidents]
 *     summary: Lấy danh sách incidents
 *     description: Trả về danh sách 50 incidents gần nhất
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách incidents
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
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

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
 *                 default: open
 *                 example: "open"
 *               category:
 *                 type: string
 *                 enum: [malware, phishing, data_breach, ddos, insider_threat, physical_security, network_intrusion, web_application, social_engineering, other]
 *                 example: "malware"
 *               source:
 *                 type: string
 *                 enum: [manual, automated, external, user_report]
 *                 default: manual
 *                 example: "automated"
 *               affectedSystems:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["web-server-01", "database-server-02"]
 *               affectedUsers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["john.doe@company.com", "jane.smith@company.com"]
 *               ipAddresses:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: ipv4
 *                 example: ["192.168.1.100", "10.0.0.5"]
 *               detectedAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-09-04T08:30:00.000Z"
 *               estimatedImpact:
 *                 type: string
 *                 enum: [minimal, minor, moderate, major, severe]
 *                 default: moderate
 *                 example: "major"
 *               assignedTo:
 *                 type: string
 *                 example: "60b8d8f8e1b2c1234567890a"
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
