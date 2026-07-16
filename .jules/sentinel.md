## 2026-07-16 - Path Traversal Protection in File Serving
**Vulnerability:** The `serveFile` controller in `backend/src/controllers/uploadController.ts` was vulnerable to Path Traversal as it used user-provided `filename` directly in `path.join` without sanitization.
**Learning:** Even with `path.join`, using raw user input for filenames allows directory climbing (e.g., `../../etc/passwd`). Normalizing slashes and using `path.basename()` is essential for Linux/Windows cross-platform security.
**Prevention:** Always sanitize filename parameters with `path.basename(filename.replace(/\\/g, '/'))` and verify the resulting path is a file using `fs.stat().isFile()` before serving.
