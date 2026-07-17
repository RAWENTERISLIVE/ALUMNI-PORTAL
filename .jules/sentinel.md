# Sentinel's Security Journal - Critical Security Learnings Only

## 2026-07-17 - Missing Internal Authorization Checks on Administrative Post Features
**Vulnerability:** The `toggleFeaturePost` endpoint in `postController.ts` lacked internal authentication and authorization checks. It only relied on the router-level middleware (`requireAdmin`) to restrict access, which violates defense-in-depth security principles.
**Learning:** Relying solely on router-level middleware for role restriction creates a single point of failure. If the router configuration is modified, or if the controller is routed to elsewhere without the middleware, the endpoint becomes publicly or globally accessible, leading to an authorization bypass.
**Prevention:** Always implement redundant, explicit internal role verification checks within the controller logic itself (e.g., checking `isAdminRole(req.user.role)`), to ensure fail-secure behavior under any routing middleware configuration.
