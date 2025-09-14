// server/middleware/errorHandler.js (ESM-only)
export default function errorHandler(err, req, res, next) {
  // Log the full error in development, but be more selective in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  const errorDetails = {
    message: err.message,
    name: err.name,
    stack: isProduction ? undefined : err.stack,
    code: err.code,
    originalError: isProduction ? undefined : err.original,
    sql: isProduction ? undefined : err.sql,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  };

  console.error('Error Handler:', JSON.stringify(errorDetails, null, 2));

  // Default error response
  let status = err.status || 500;
  let message = isProduction ? 'Something went wrong' : err.message;
  let errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  let details = isProduction ? undefined : errorDetails;

  // Handle specific error types
  if (err.name === 'SequelizeValidationError') {
    status = 400;
    message = 'Validation Error';
    errorCode = 'VALIDATION_ERROR';
    details = (err.errors || []).map(e => ({
      field: e.path,
      message: e.message,
      type: e.type,
      value: e.value
    }));
  } 
  else if (err.name === 'SequelizeUniqueConstraintError') {
    status = 409;
    message = 'Duplicate entry';
    errorCode = 'DUPLICATE_ENTRY';
    details = (err.errors || []).map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
  }
  else if (err.name === 'SequelizeDatabaseError') {
    status = 400;
    message = 'Database Error';
    errorCode = 'DATABASE_ERROR';
  }
  else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
    errorCode = 'INVALID_TOKEN';
  }
  else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
    errorCode = 'TOKEN_EXPIRED';
  }

  // Don't leak error details in production for 500 errors
  if (status >= 500 && isProduction) {
    message = 'Internal Server Error';
    details = undefined;
  }

  // Send error response
  res.status(status).json({
    success: false,
    error: {
      code: errorCode,
      message,
      details
    },
    // Include request ID if available
    requestId: req.id
  });
}
