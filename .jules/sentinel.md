## 2025-05-15 - [HIGH] Fix Path Traversal in file uploads

**Vulnerability:**
The `serveFile` controller in `backend/src/controllers/uploadController.ts` was vulnerable to Path Traversal. It directly used the `filename` parameter from the request URL to construct a file path on the server without sanitization. This allowed an attacker to access sensitive files outside of the intended `uploads/` directory using sequences like `../../`.

**Learning:**
Even with `path.join()`, using raw user input for filenames is dangerous. Additionally, on Linux servers, Windows-style path separators (`\`) are not automatically handled by `path.basename()` as directory separators, requiring manual normalization.

**Prevention:**
Always sanitize user-provided filenames using `path.basename()` after normalizing path separators. Additionally, verify that the resolved path points to a file and not a directory using `fs.statSync().isFile()` before serving it.
