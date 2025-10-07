"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordResetLimiter = exports.registrationLimiter = exports.generalLimiter = exports.authLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '60000'),
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '1000'),
    message: {
        success: false,
        error: 'Too many authentication attempts from this IP. Please try again in 15 minutes.',
        code: 'RATE_LIMIT_AUTH'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            error: 'Too many authentication attempts from this IP. Please try again in 15 minutes.',
            code: 'RATE_LIMIT_AUTH'
        });
    }
});
exports.generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    max: parseInt(process.env.RATE_LIMIT_MAX || '10000'),
    message: {
        success: false,
        error: 'Too many requests from this IP. Please try again later.',
        code: 'RATE_LIMIT_GENERAL'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`General rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            error: 'Too many requests from this IP. Please try again later.',
            code: 'RATE_LIMIT_GENERAL'
        });
    }
});
exports.registrationLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        error: 'Too many registration attempts. Please try again in 1 hour.',
        code: 'RATE_LIMIT_REGISTRATION'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`Registration rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            error: 'Too many registration attempts. Please try again in 1 hour.',
            code: 'RATE_LIMIT_REGISTRATION'
        });
    }
});
exports.passwordResetLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        error: 'Too many password reset attempts. Please try again in 1 hour.',
        code: 'RATE_LIMIT_PASSWORD_RESET'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`Password reset rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            error: 'Too many password reset attempts. Please try again in 1 hour.',
            code: 'RATE_LIMIT_PASSWORD_RESET'
        });
    }
});
//# sourceMappingURL=rateLimiter.js.map