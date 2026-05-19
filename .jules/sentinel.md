# Sentinel Security Journal 🛡️

## 2025-05-15 - [Mass Assignment and Rate Limit Bypass]
**Vulnerability:** The `updateProfile` function used `...req.body` directly in Prisma updates, allowing mass assignment. Additionally, rate limiting was globally disabled with `skip: () => true`.
**Learning:** Hardcoded bypasses in middleware can leave the application exposed even if rate limiters are defined. Mass assignment patterns are common in rapid development and must be replaced with whitelists.
**Prevention:** Always use whitelists for user-controllable updates. Ensure middleware bypasses are environment-specific (e.g., restricted to 'test').
