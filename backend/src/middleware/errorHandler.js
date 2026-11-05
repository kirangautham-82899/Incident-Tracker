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

    // PostgreSQL errors
    if (err.code === '23505') { // unique_violation
        statusCode = 400;
        message = err.constraint === 'users_email_key' ? 'User already exists with this email' : 'Record already exists';
    } else if (err.code === '23514' || err.code === '23502') { // check / not-null violation
        statusCode = 400;
        message = 'Invalid or missing field value';
    } else if (err.code === '22P02') { // invalid text representation (e.g. bad uuid)
        statusCode = 404;
        message = 'Resource not found';
    } else if (err.code === '23503') { // foreign key violation
        statusCode = 400;
        message = 'Referenced record does not exist';
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
