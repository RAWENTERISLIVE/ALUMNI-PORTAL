# Sentinel Security Journal 🛡️

## 2025-07-05 - Path Traversal Prevention in File Serving
**Vulnerability:** Path traversal in `serveFile` controller allowed access to files outside the intended `uploads` directory.
**Learning:** Simple parameter usage from `req.params` without sanitization is a major security risk when interacting with the filesystem.
**Prevention:** Always sanitize filenames using `path.basename()` and replace backslashes to handle Windows-style paths on Linux. Use `fs.statSync().isFile()` to ensure only files are served.
