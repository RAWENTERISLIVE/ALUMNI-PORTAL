## 2026-06-13 - [Path Traversal in File Serving]
**Vulnerability:** The `serveFile` controller was directly using user-provided `filename` parameters in `path.join()`, allowing access to arbitrary files on the server.
**Learning:** Even with simple Express routing, parameters like `req.params.filename` must be sanitized if used in filesystem operations.
**Prevention:** Use `path.basename()` and replace backslashes with forward slashes to ensure the resulting filename is constrained to the intended directory.
