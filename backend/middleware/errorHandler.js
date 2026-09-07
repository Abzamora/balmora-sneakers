/**
 * Express error-handling middleware (must have 4 args to be recognized as
 * such). Every controller uses express-async-handler, so thrown errors and
 * rejected promises all land here instead of crashing the process.
 */
function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  // If a controller set res.status(...) before throwing, respect it;
  // otherwise default to 500.
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}

module.exports = { notFound, errorHandler };
