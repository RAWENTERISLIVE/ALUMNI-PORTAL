## 2025-02-14 - Path Traversal in File Serving
**Vulnerability:** The `serveFile` controller in `uploadController.ts` was directly using the `filename` from request parameters to construct a file path using `path.join()`.
**Learning:** Even when using `path.join()` with a hardcoded base directory, user-provided filenames containing `..` can escape the intended directory if not sanitized.
**Prevention:** Always use `path.basename()` on user-provided filenames before using them in path construction to ensure they remain within the target directory.
