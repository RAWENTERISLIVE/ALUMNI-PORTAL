# Sentinel Security Journal

## 2025-05-15 - [Initial Scan]
**Vulnerability:** Hardcoded fallback secrets for JWT in multiple controllers and middleware.
**Learning:** The application uses `process.env.JWT_SECRET || 'fallback-value'` pattern, which provides a false sense of security and a predictable default.
**Prevention:** Always require security-critical environment variables to be set and throw an error during initialization if they are missing.
