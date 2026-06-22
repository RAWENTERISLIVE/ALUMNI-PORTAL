## 2025-05-22 - [Path Traversal in File Serving]
**Vulnerability:** The `serveFile` controller in `backend/src/controllers/uploadController.ts` was using `req.params.filename` directly in `path.join()` without sanitization, allowing path traversal attacks.
**Learning:** Even simple file-serving endpoints can be critical entry points for path traversal if user input is trusted to construct file paths.
**Prevention:** Always use `path.basename()` to sanitize filenames and replace backslashes with forward slashes before sanitization to ensure cross-platform safety. Additionally, verify that the resulting path is not a directory.
