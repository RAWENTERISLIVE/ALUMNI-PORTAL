# Sentinel Security Journal

## 2026-08-13 - Secure Error Handling in Comment Controller
**Vulnerability:** Information Disclosure (CWE-209). Catch blocks in `commentController.ts` were catching exceptions as `any` and returning `error.message` directly in HTTP 500 JSON responses. This leaked underlying database or execution exceptions to clients.
**Learning:** The application was catching errors as type `any` and returning the error string directly for debugging convenience. In a production-ready application, leaking details in API responses is highly dangerous as it reveals internal database schemas, structure, or technologies used.
**Prevention:** Always catch errors as `unknown` (or type-check them if needed) and return generic, secure error messages (e.g., 'Failed to create comment') in client responses. Log the actual detailed errors server-side via robust logging mechanisms like `console.error` for developer diagnostics.
