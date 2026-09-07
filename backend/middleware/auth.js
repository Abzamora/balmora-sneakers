const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Admin = require('../models/Admin');

/**
 * Verifies the "Authorization: Bearer <token>" header on every protected
 * request. On success, attaches the admin document (without the hash) to
 * req.admin so downstream controllers know who is acting.
 */
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = await Admin.findById(decoded.id).select('-passwordHash');

    if (!req.admin) {
      res.status(401);
      throw new Error('Not authorized, admin no longer exists');
    }

    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized, token invalid or expired');
  }
});

module.exports = { protect };
