## 2025-05-15 - [Path Traversal in File Serving]
**Vulnerability:** The `serveFile` controller in `uploadController.ts` was directly using a user-provided `filename` parameter from the URL to construct a file path using `path.join()`. This allowed an attacker to use sequences like `../../` to access files outside the intended `uploads/` directory.
**Learning:** Even when using `path.join()` with a base directory, user-controlled input must be sanitized if it's used as a path segment. `path.join` does not automatically resolve or block traversal sequences.
**Prevention:** Always wrap user-provided filenames or path segments in `path.basename()` before joining them to a base path. This strips any directory information and keeps only the filename.
