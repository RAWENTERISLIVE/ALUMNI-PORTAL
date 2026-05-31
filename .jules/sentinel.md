## 2026-05-31 - [Critical] Rate Limiting Bypass and Missing Application
**Vulnerability:** Global rate limiting bypass and missing application to sensitive endpoints.
**Learning:** The rate limiter configuration used a `withEnvironmentBypass` wrapper that explicitly set `skip: () => true`, effectively disabling all rate limiters across the application. Furthermore, these limiters were defined but never applied to any routes in the Express application.
**Prevention:** Always verify that security middleware is both correctly configured (not bypassed by default in production-like environments) and explicitly applied to the intended routes. Use automated tests to verify that rate limits are enforced.
