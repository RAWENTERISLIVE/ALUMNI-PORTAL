## 2026-06-09 - [HIGH] Path Traversal in File Serving
**Vulnerability:** The `serveFile` controller in `backend/src/controllers/uploadController.ts` used unsanitized user input (`req.params.filename`) to construct file paths, allowing arbitrary file read access on the server via `../` sequences.
**Learning:** Even when serving from a specific directory, failing to sanitize the filename component can lead to path traversal. Node's `path.join` does not prevent escaping the base directory if `../` is present in the input.
**Prevention:** Always use `path.basename()` on user-provided filenames before using them in path construction. Additionally, sanitize both forward and backward slashes to handle cross-platform traversal attempts.
