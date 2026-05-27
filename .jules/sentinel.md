# Sentinel's Journal - Critical Security Learnings

## 2025-05-15 - Fixed rate limiter bypass and applied to auth routes
**Vulnerability:** Rate limiting was effectively disabled across the entire backend due to a hardcoded `skip: () => true` in the `withEnvironmentBypass` wrapper. Furthermore, several critical authentication endpoints (registration, login, password reset) were not using the defined rate limiters.
**Learning:** Hardcoded bypasses for development can easily be left in production code, creating a significant security gap. Rate limiting is a crucial defense-in-depth measure against brute-force and DoS attacks.
**Prevention:** Use environment variables to control development-only bypasses and ensure that security middleware is explicitly applied to sensitive routes during the initial implementation. Always verify that rate limiters are active in production-like environments.
