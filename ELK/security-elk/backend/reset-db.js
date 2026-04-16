const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Incident = require('./models/Incident');
const Alert = require('./models/Alert');
const BlockedIP = require('./models/BlockedIP');
const AuditLog = require('./models/AuditLog');

dotenv.config();

const resetData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for cleanup...');

    console.log('Cleaning up Incidents...');
    await Incident.deleteMany({});

    console.log('Cleaning up Alerts...');
    await Alert.deleteMany({});

    console.log('Cleaning up Blocked IPs...');
    await BlockedIP.deleteMany({});

    console.log('Cleaning up Audit Logs...');
    await AuditLog.deleteMany({});

    console.log('SUCCESS: All incident-related data cleared.');
    process.exit(0);
  } catch (error) {
    console.error('ERROR during cleanup:', error);
    process.exit(1);
  }
};

resetData();
