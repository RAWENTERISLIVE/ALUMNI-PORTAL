# Sentinel Security Journal 🛡️

This journal documents critical security learnings, vulnerability patterns, and prevention strategies discovered within the Alma Connect Sphere application codebase.

## 2026-05-27 - Bypassed and Unapplied Rate Limiting on Authentication and General API routes
**Vulnerability:**
A major security bypass was identified in `backend/src/middleware/rateLimiter.ts` where the `withEnvironmentBypass` helper was hardcoded with `skip: () => true`, effectively disabling rate limiting on every endpoint and in every environment. Furthermore, none of the specific auth rate limiters (`authLimiter`, `registrationLimiter`, `passwordResetLimiter`) were imported or applied in `backend/src/routes/auth.ts`, and the `generalLimiter` was completely omitted from `backend/src/server.ts`. This left the application completely vulnerable to brute-force authentication attacks, credential stuffing, and Denials of Service (DoS).

**Learning:**
Developers often disable or bypass security constraints (like rate limits) during development or manual testing of user flows to avoid getting locked out or slowed down, but may inadvertently commit these overrides or omit the registration of limiters in the production route definitions. This highlights the risk of relying on local configurations that bypass production-like security middlewares globally without explicit environment-based conditional guards.

**Prevention:**
1. Avoid hardcoding total skips (like `skip: () => true`) in security middlewares.
2. Implement strict environment checks (e.g., `process.env.NODE_ENV === 'test'` or an explicit `DISABLE_RATE_LIMIT === 'true'` toggle) to allow testing while keeping defenses active in all standard runs.
3. Establish a standard checklist and audit of route registrations to confirm that rate limiters and validation middlewares are active on all public and authentication-related endpoints.
