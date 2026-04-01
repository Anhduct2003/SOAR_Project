const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');
const axios = require('axios');

/**
 * @swagger
 * /api/health/status:
 *   get:
 *     tags: [Monitoring]
 *     summary: Check system services status
 *     security:
 *       - bearerAuth: []
 */
router.get('/status', protect, async (req, res) => {
  const status = {
    backend: 'connected',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    elasticsearch: 'unknown'
  };

  try {
    // Basic connectivity check to Elastic
    const esUrl = process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200';
    await axios.get(esUrl, { timeout: 2000 });
    status.elasticsearch = 'connected';
  } catch (err) {
    status.elasticsearch = 'disconnected';
  }

  res.json({ success: true, data: status });
});

module.exports = router;
