export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  // Bug fix: Log the full error server-side so startup and runtime issues are visible
  // in Docker logs. Original silently swallowed all errors; impossible to debug.
  console.error(`[${req.method} ${req.originalUrl}]`, error.message || error);

  const status = error.status || 500;
  res.status(status).json({
    message: error.message || 'Internal server error'
  });
}
