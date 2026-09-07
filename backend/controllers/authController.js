const asyncHandler = require('express-async-handler');
const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');

/**
 * POST /api/auth/login
 * Public. Exchanges username + password for a JWT the admin panel stores
 * (in memory / httpOnly-friendly header, never localStorage for sensitive
 * apps — see frontend AuthContext for the chosen approach).
 */
const loginAdmin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400);
    throw new Error('Username and password are required');
  }

  const admin = await Admin.findOne({ username: username.toLowerCase() });

  if (!admin || !(await admin.comparePassword(password))) {
    // Same error for "no such user" and "wrong password" — never reveal
    // which one it was, that leaks account existence to attackers.
    res.status(401);
    throw new Error('Invalid credentials');
  }

  admin.lastLoginAt = new Date();
  await admin.save();

  res.json({
    id: admin._id,
    username: admin.username,
    role: admin.role,
    token: generateToken(admin._id),
  });
});

/**
 * GET /api/auth/me
 * Protected. Lets the admin panel verify a stored token is still valid on
 * app load, and re-hydrate the logged-in user without a full re-login.
 */
const getMe = asyncHandler(async (req, res) => {
  res.json(req.admin); // req.admin was set by the `protect` middleware
});

module.exports = { loginAdmin, getMe };
