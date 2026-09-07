/**
 * Run once to create the first admin login:
 *   node seed/seedAdmin.js myusername myStrongPassword123
 *
 * Safe to re-run: it will refuse if the username already exists instead of
 * overwriting credentials silently.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function run() {
  const [, , username, password] = process.argv;

  if (!username || !password) {
    console.error('Usage: node seed/seedAdmin.js <username> <password>');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existing = await Admin.findOne({ username: username.toLowerCase() });
  if (existing) {
    console.error(`Admin "${username}" already exists. Aborting.`);
    process.exit(1);
  }

  const passwordHash = await Admin.hashPassword(password);
  await Admin.create({ username: username.toLowerCase(), passwordHash, role: 'superadmin' });

  console.log(`Admin "${username}" created successfully.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
