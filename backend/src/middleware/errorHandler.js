// Wrap async route handlers so rejected promises reach the error handler
export const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Error with an HTTP status code
export class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}

// Global error handler middleware
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Server Error';

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        statusCode = 404;
        message = 'Resource not found';
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || 'Field';
        statusCode = 400;
        message = `${field} already exists`;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }

    // Malformed JSON body
    if (err.type === 'entity.parse.failed') {
        statusCode = 400;
        message = 'Malformed JSON body';
    }

    // Payload too large
    if (err.type === 'entity.too.large') {
        statusCode = 413;
        message = 'Request body too large';
    }

    // Multer upload errors
    if (err.name === 'MulterError') {
        statusCode = 400;
        message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 10MB)' : err.message;
    }

    if (statusCode >= 500) {
        console.error('Error:', err);
    }

    res.status(statusCode).json({
        success: false,
        error: statusCode >= 500 && process.env.NODE_ENV === 'production' ? 'Server Error' : message
    });
};

// Not found middleware
export const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.originalUrl} not found`
    });
};
