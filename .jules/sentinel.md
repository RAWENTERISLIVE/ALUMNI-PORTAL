# Sentinel Security Journal 🛡️

## 2025-05-14 - [Critical] Path Traversal in File Serving
**Vulnerability:** The `serveFile` controller in `backend/src/controllers/uploadController.ts` was directly using the `filename` parameter from the URL to construct a file path without sanitization. An attacker could use `../` sequences to access files outside the `uploads` directory.
**Learning:** Even when using `path.join`, if the last argument is an absolute path or contains traversal sequences, it can lead to accessing unintended files. `res.sendFile` also doesn't automatically protect against all traversal if the path is already "malformed".
**Prevention:** Always sanitize user-provided filenames using `path.basename()` and validate the type of input. For cross-platform robustness, replace backslashes with forward slashes before applying `path.basename()`.
