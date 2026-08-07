# Sentinel Security Journal 🛡️

## 2026-08-07 - File Serving Path Traversal Prevention
**Vulnerability:** The `/api/uploads/:filename` route allowed arbitrary path traversal when serving uploaded files. Users could input path traversal patterns (e.g., `../../package.json` or `..\\..\\package.json`) to escape the `uploads/` directory and read sensitive system/code configuration files.
**Learning:** The route controller resolved paths using simple string concatenation/join via `path.join(__dirname, '../../uploads', filename)` without ensuring the parameter is sanitized or that the resolved path is strictly contained within the intended directory.
**Prevention:** Always validate that incoming filename parameters are strings, extract the base filename via `path.basename` (handling both forward/backward slashes), resolve the absolute path, verify it remains within the target uploads directory via `startsWith`, and ensure the target path represents a file (using `fs.statSync(filePath).isFile()`) rather than a directory.
