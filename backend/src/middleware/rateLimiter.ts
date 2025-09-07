import rateLimit from 'express-rate-limit';

// Phase 1 - Enhanced rate limiting for authentication security
export const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute for development
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '1000'), // 1000 attempts for development
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

export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute window for development
  max: parseInt(process.env.RATE_LIMIT_MAX || '10000'), // 10000 requests for development
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

// Specific limiter for registration attempts
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per hour per IP
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

// Password reset rate limiter
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour per IP
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
