export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Default error
  let error = { ...err };
  error.message = err.message;

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map(e => e.message).join(', ');
    error = { message, status: 400 };
  }

  //Sequelize UniqueConstraintError
    if (err.name === 'SequelizeUniqueConstraintError') {
        const message = 'Duplicate field value entered';
        error = { message, status: 400 };
    }


  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Server Error'
  });
};