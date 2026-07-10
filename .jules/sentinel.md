# Sentinel Security Journal

## 2026-07-10 - [Path Traversal Prevention]
**Vulnerability:** Path traversal vulnerability in `serveFile` controller allowed unauthorized access to files outside the intended `uploads` directory.
**Learning:** Using `req.params` directly in `path.join` without sanitization is dangerous. `path.basename` is essential to strip directory components from user-provided filenames.
**Prevention:** Always use `path.basename()` on user-provided filenames and verify that the resolved path is indeed a file and resides within the expected directory.
