const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/security_incidents';

const MONGO_OPTIONS = {
  maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE, 10) || 50,
  minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE, 10) || 10,
  maxConnecting: parseInt(process.env.MONGO_MAX_CONNECTING, 10) || 5,
  serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 10) || 5000,
  socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT_MS, 10) || 45000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true,
};

let connectionRetries = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 3000;

async function connectDB() {
  try {
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected');
      connectionRetries = 0;
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    await mongoose.connect(MONGODB_URI, MONGO_OPTIONS);
  } catch (err) {
    connectionRetries += 1;
    if (connectionRetries < MAX_RETRIES) {
      logger.warn(`MongoDB connection failed (attempt ${connectionRetries}/${MAX_RETRIES}). Retrying in ${RETRY_DELAY / 1000}s...`);
      setTimeout(() => connectDB(), RETRY_DELAY);
    } else {
      logger.error('MongoDB connection failed after maximum retries:', err.message);
      process.exit(1);
    }
  }
}

async function disconnectDB() {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB disconnected gracefully');
  } catch (err) {
    logger.error('Error closing MongoDB connection:', err.message);
  }
}

async function healthCheck() {
  try {
    const state = mongoose.connection.readyState;
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (state !== 1) {
      return { status: 'disconnected', readyState: state };
    }

    await mongoose.connection.db.admin().ping();
    return {
      status: 'connected',
      readyState: state,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  } catch (err) {
    return {
      status: 'error',
      readyState: mongoose.connection.readyState,
      error: err.message,
    };
  }
}

module.exports = { connectDB, disconnectDB, healthCheck };
