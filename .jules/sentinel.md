## 2026-06-16 - [Path Traversal in File Serving]
**Vulnerability:** The `serveFile` function in `uploadController.ts` used unsanitized user input (`req.params.filename`) directly in `path.join`, allowing for path traversal attacks using `..` sequences.
**Learning:** Even when using `path.join` with a base directory, if the second argument starts with `..` or is an absolute path, it can lead to files being served outside the intended directory.
**Prevention:** Always sanitize filename parameters from users using `path.basename()` and ensure the input is a string.
