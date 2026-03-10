/*
  Utility script to reset the admin user's password using Mongoose
  Usage inside container: node scripts/update-admin-password.js
*/

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

async function run() {
  const newPassword = process.env.ADMIN_NEW_PASSWORD || 'admin123';
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/security_incidents';

  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const user = await User.findOne({ email: 'admin@security.local' }).select('+password');
    if (!user) {
      console.log('Admin user not found.');
      process.exit(0);
    }

    user.password = newPassword; // pre-save hook will hash it
    user.isActive = true;
    await user.save();

    console.log('Admin password updated successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to update admin password:', err);
    process.exit(1);
  }
}

run();


