function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  let statusCode =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message;

  if (err.name === "MulterError") {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE")
      message = "Una de las imágenes pesa más de 8 MB";
    else if (err.code === "LIMIT_UNEXPECTED_FILE")
      message = "Demasiadas imágenes a la vez (máximo 10)";
  } else if (err.code === 11000) {
    statusCode = 400;
    message = "Ya existe un producto con ese SKU";
  } else if (err.statusCode) {
    statusCode = err.statusCode;
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
}

module.exports = { notFound, errorHandler };
