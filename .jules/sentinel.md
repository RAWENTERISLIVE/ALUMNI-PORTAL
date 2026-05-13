## 2025-05-13 - Path Traversal in File Serving
**Vulnerability:** The `/api/uploads/:filename` endpoint was vulnerable to path traversal because it directly used the `filename` parameter from the URL in a `path.join()` call without sanitization.
**Learning:** Even when serving files from a dedicated uploads directory, parameters must be sanitized using `path.basename()` to prevent directory traversal attacks (e.g., `../../package.json`).
**Prevention:** Always use `path.basename()` on user-provided filenames before using them to construct file system paths.
