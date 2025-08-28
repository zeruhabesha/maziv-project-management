// server/middleware/errorHandler.js (ESM-only)
export default function errorHandler(err, req, res, next) {
  console.error(err.stack || err);

  // Default
  let status = err.status || 500;
  let message = err.message || "Server Error";

  // Sequelize validation error
  if (err.name === "SequelizeValidationError") {
    status = 400;
    message = (err.errors || []).map(e => e.message).join(", ");
  }

  // Sequelize unique constraint
  if (err.name === "SequelizeUniqueConstraintError") {
    status = 400;
    message = "Duplicate field value entered";
  }

  res.status(status).json({
    success: false,
    message,
  });
}
