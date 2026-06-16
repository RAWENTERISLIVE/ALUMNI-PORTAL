## 2025-05-15 - Disabled Rate Limiting Logic
**Vulnerability:** Rate limiting was effectively disabled because the `skip` function was hardcoded to return `true`, and the limiters were not applied to any routes.
**Learning:** Security middleware can be present in the codebase but completely bypassed if not correctly configured or integrated into the application routes.
**Prevention:** Always verify that security middleware is both properly configured (not bypassed) and actually applied to the relevant routes. Use environment variables for optional bypasses during development/testing.
