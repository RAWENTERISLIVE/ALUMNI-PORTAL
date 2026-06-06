## 2025-05-15 - [Path Traversal in serveFile]
**Vulnerability:** Path traversal in `serveFile` controller allowed access to arbitrary files by including `../` in the `filename` parameter.
**Learning:** Using `path.join` with unsanitized user input is a common source of path traversal vulnerabilities.
**Prevention:** Always sanitize filenames from user input using `path.basename()` to strip directory components before joining with a base path.
