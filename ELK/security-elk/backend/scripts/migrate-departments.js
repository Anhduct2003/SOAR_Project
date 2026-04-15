const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Department = require('../models/Department');
const User = require('../models/User');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/security_incidents';
const isDryRun = process.argv.includes('--dry-run');

const normalizeDepartmentName = (value = '') => value.trim().replace(/\s+/g, ' ');

const generateDepartmentCode = (value = '') =>
  normalizeDepartmentName(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

const normalizeLegacyDepartment = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedName = normalizeDepartmentName(value);
  if (!normalizedName) {
    return null;
  }

  return {
    originalValue: value,
    normalizedName,
    code: generateDepartmentCode(normalizedName)
  };
};

async function findOrCreateDepartment({ normalizedName, code }, summary, cache) {
  const cacheKey = `${normalizedName}::${code}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  let department = await Department.findOne({
    $or: [{ name: normalizedName }, { code }]
  });

  if (department) {
    if (!department.isActive) {
      summary.departmentsReactivated += 1;
      if (!isDryRun) {
        department.isActive = true;
        await department.save();
      }
    } else {
      summary.departmentsReused += 1;
    }

    cache.set(cacheKey, department);
    return department;
  }

  summary.departmentsCreated += 1;

  if (isDryRun) {
    const dryRunDepartment = {
      _id: `dry-run:${code}`,
      name: normalizedName,
      code,
      isActive: true
    };
    cache.set(cacheKey, dryRunDepartment);
    return dryRunDepartment;
  }

  department = await Department.create({
    name: normalizedName,
    code,
    description: '',
    isActive: true,
    sortOrder: 0
  });

  cache.set(cacheKey, department);
  return department;
}

async function migrate() {
  const summary = {
    mode: isDryRun ? 'dry-run' : 'apply',
    totalUsersScanned: 0,
    usersWithDepartmentValue: 0,
    usersSkipped: 0,
    usersAlreadyAssigned: 0,
    usersUpdated: 0,
    usersWouldUpdate: 0,
    departmentsCreated: 0,
    departmentsReused: 0,
    departmentsReactivated: 0,
    normalizedMappings: {},
    skippedValues: {}
  };
  const departmentCache = new Map();

  try {
    await mongoose.connect(mongoUri);

    const users = await User.find({})
      .select('_id email username department departmentId isActive')
      .sort({ createdAt: 1 });

    summary.totalUsersScanned = users.length;

    for (const user of users) {
      const normalized = normalizeLegacyDepartment(user.department);

      if (!normalized) {
        summary.usersSkipped += 1;
        const skippedKey =
          typeof user.department === 'string' ? JSON.stringify(user.department) : String(user.department);
        summary.skippedValues[skippedKey] = (summary.skippedValues[skippedKey] || 0) + 1;
        continue;
      }

      summary.usersWithDepartmentValue += 1;
      summary.normalizedMappings[normalized.normalizedName] = normalized.code;

      const department = await findOrCreateDepartment(normalized, summary, departmentCache);
      const currentDepartmentId = user.departmentId ? String(user.departmentId) : null;
      const targetDepartmentId = String(department._id);
      const departmentNameChanged = user.department !== normalized.normalizedName;

      if (currentDepartmentId === targetDepartmentId && !departmentNameChanged) {
        summary.usersAlreadyAssigned += 1;
        continue;
      }

      if (isDryRun) {
        summary.usersWouldUpdate += 1;
        continue;
      }

      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            department: normalized.normalizedName,
            departmentId: department._id
          }
        },
        { runValidators: false }
      );

      summary.usersUpdated += 1;
    }

    console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Department migration failed:', error);
    process.exit(1);
  } finally {
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      // ignore disconnect cleanup errors in script mode
    }
  }
}

migrate();
