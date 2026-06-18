## 2026-06-18 - [Path Traversal in File Serving]
**Vulnerability:** The `serveFile` endpoint in `uploadController.ts` was directly using the `filename` parameter from the URL to construct a file path, allowing for directory traversal attacks (e.g., `../../package.json`).
**Learning:** Even with `path.join`, if the last argument is an absolute path or contains traversal sequences like `..`, it can escape the intended directory.
**Prevention:** Use `path.basename()` to strip any directory components from user-supplied filenames before using them in file system operations. Also, ensure cross-platform compatibility by replacing backslashes with forward slashes before applying `path.basename()`.
