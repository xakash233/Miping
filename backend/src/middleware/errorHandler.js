const AppError = require('../utils/AppError');

const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    console.error('ERROR 💥', err);

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            success: false,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    } else {
        // Production
        if (err.isOperational) {
            res.status(err.statusCode).json({
                success: false,
                message: err.message,
                error_code: err.errorCode,
            });
        } else {
            // Programming or other unknown error: don't leak error details
            res.status(500).json({
                success: false,
                message: 'Something went very wrong!',
                error_code: 'INTERNAL_SERVER_ERROR',
            });
        }
    }
};

module.exports = globalErrorHandler;
