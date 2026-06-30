## 2026-06-30 - [Path Traversal in File Serving]
**Vulnerability:** The `serveFile` controller in `backend/src/controllers/uploadController.ts` was directly using the `filename` parameter from the request URL to construct a file path without sanitization. This allowed attackers to use `../` sequences to access arbitrary files on the server (e.g., `../../package.json`).

**Learning:** Express route parameters should never be trusted for filesystem operations. Even with a prefix directory, `path.join` will resolve `../` sequences, potentially moving outside the intended directory.

**Prevention:** Always sanitize filenames using `path.basename()` which strips directory information. Additionally, verify that the resolved path exists, is a file, and (optionally) resides within the expected base directory. Using `path.resolve` and checking if the path starts with the base directory is another layer of defense.
