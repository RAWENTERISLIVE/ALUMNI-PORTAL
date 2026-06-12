## 2025-06-12 - [Path Traversal in File Uploads]
**Vulnerability:** The `serveFile` controller in `backend/src/controllers/uploadController.ts` was vulnerable to path traversal because it used user-provided `filename` directly in `path.join()` without sanitization.
**Learning:** Even with a dedicated uploads directory, attackers can use `../` to escape and read sensitive files like `package.json`, `.env`, or source code. `path.basename()` is a simple and effective way to strip directory components.
**Prevention:** Always sanitize user-provided filenames using `path.basename()` before using them in file system operations. For extra security, ensure the resolved path starts with the intended base directory.
