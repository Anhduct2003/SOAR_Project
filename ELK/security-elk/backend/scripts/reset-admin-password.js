// Reset admin password without triggering email regex validation
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function reset() {
  const newPassword = process.env.ADMIN_NEW_PASSWORD || 'admin123';
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/security_incidents';
  try {
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(newPassword, salt);

    const res = await User.updateOne(
      { email: 'admin@security.local' },
      { $set: { password: hash, isActive: true } },
      { runValidators: false }
    );
    console.log('Matched:', res.matchedCount, 'Modified:', res.modifiedCount);
    process.exit(0);
  } catch (e) {
    console.error('Error resetting password:', e);
    process.exit(1);
  }
}

reset();


