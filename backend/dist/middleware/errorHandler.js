"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = void 0;
const errorHandler = (err, _req, res, _next) => {
    let error = { ...err };
    error.message = err.message;
    console.error(err);
    if (err.code === 'P2002') {
        const message = 'Duplicate field value entered';
        error = { statusCode: 400, message };
    }
    if (err.code === 'P2025') {
        const message = 'Resource not found';
        error = { statusCode: 404, message };
    }
    if (err.code === 'P2023') {
        const message = 'Invalid ID format';
        error = { statusCode: 400, message };
    }
    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error'
    });
};
exports.errorHandler = errorHandler;
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map