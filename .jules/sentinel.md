## 2025-05-22 - [Fix] Path Traversal in File Upload Controller
**Vulnerability:** Unsanitized user input in `serveFile` controller allowed arbitrary file reading via `filename` parameter.
**Learning:** Using `path.join` with raw request parameters without sanitization is a classic path traversal risk.
**Prevention:** Always use `path.basename()` to strip directory information from user-provided filenames and verify that the resolved path is indeed a file using `fs.statSync(filePath).isFile()`. Additionally, replace backslashes with forward slashes before calling `path.basename()` to handle Windows-style path traversal attempts on Linux servers.
