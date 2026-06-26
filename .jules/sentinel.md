## 2025-05-15 - [Path Traversal in serveFile]
**Vulnerability:** The `serveFile` endpoint in `uploadController.ts` was vulnerable to path traversal because it joined `req.params.filename` directly to the uploads path without sanitization.
**Learning:** `path.join` with unsanitized user input allows attackers to escape the intended directory using `../` sequences.
**Prevention:** Always sanitize filenames from user input using `path.basename()` before using them in file system operations.
