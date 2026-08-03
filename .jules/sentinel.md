## 2026-08-03 - Secure Error Handling in Comments Controller
**Vulnerability:** Information Disclosure via Raw Error Messages
**Learning:** The Comments Controller was leaking internal implementation details (such as database structure, schema configurations, or Prisma query failures) directly to users via returning raw `error.message` in HTTP 500 JSON responses. This exposes system internals to potential attackers.
**Prevention:** Avoid passing raw `error.message` to response JSON objects. Always type catch block arguments as `unknown`, log the actual error securely on the server-side, and return a standardized, generic error message (e.g., "Failed to create comment") on client-facing responses.
