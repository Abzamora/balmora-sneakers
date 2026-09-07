const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

// Instance method used by the login controller to verify a plaintext password
adminSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// Static helper so callers never handle raw bcrypt directly
adminSchema.statics.hashPassword = function (plainPassword) {
  return bcrypt.hash(plainPassword, 12);
};

module.exports = mongoose.model('Admin', adminSchema);
