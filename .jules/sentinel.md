## 2024-05-15 - Path Traversal in File Serving
**Vulnerability:** The `serveFile` controller was directly using the `filename` parameter from the request to construct the file path, allowing directory traversal (e.g., `../../etc/passwd`).
**Learning:** Always sanitize user-provided filenames using `path.basename()` before constructing file paths, even if the files are intended to be public.
**Prevention:** Use a whitelist of allowed characters or sanitize with `path.basename()` to strip directory navigation components.

## 2024-05-15 - Hardcoded Rate Limiter Bypass
**Vulnerability:** The `withEnvironmentBypass` utility was hardcoded to skip rate limiting (`skip: () => true`), rendering all applied rate limiters ineffective.
**Learning:** Environment-specific bypasses should always be controlled by actual environment variables (e.g., `SKIP_RATE_LIMIT`) rather than being hardcoded to `true` during development.
**Prevention:** Use environment variables to control security features and ensure they default to secure states in production.
