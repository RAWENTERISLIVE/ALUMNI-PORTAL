# Sentinel Security Journal

## 2026-07-03 - Path Traversal Prevention in File Serving
**Vulnerability:** The `serveFile` controller in `backend/src/controllers/uploadController.ts` was directly using the `filename` parameter from the URL to construct a file path on the server without sanitization. This could allow an attacker to use `../` sequences to access sensitive files outside of the intended `uploads/` directory (e.g., `.env` or system files).

**Learning:** `path.join` does not resolve `../` sequences to prevent traversal; it simply appends them. Relying on `fs.existsSync` alone is insufficient if the resolved path points to a sensitive file. Additionally, on Linux systems, backslashes (`\`) are not treated as path separators by `path.basename`, which can be bypassed if the application receives Windows-style paths.

**Prevention:** Always sanitize user-provided filenames using `path.basename()`. To ensure cross-platform robustness, replace backslashes with forward slashes before sanitizing. Additionally, verify that the final path exists and is actually a file (using `fs.statSync(filePath).isFile()`) to prevent directory listing or other unexpected access.
