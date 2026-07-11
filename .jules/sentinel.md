# Sentinel Security Journal 🛡️

## 2025-05-14 - [Path Traversal in File Serving]
**Vulnerability:** The `serveFile` controller in `backend/src/controllers/uploadController.ts` was vulnerable to path traversal because it directly joined user-supplied `filename` parameters with the uploads directory path without sanitization.
**Learning:** Even with `path.join`, user input containing `..` can escape the intended directory if not sanitized using `path.basename`.
**Prevention:** Always use `path.basename()` on user-supplied filenames before using them in filesystem operations to ensure they refer to a single file within the intended directory.
