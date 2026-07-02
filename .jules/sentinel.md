## 2025-07-02 - Path Traversal Prevention in File Serving
**Vulnerability:** The `serveFile` controller was directly joining the `filename` request parameter with the uploads directory path without sanitization, allowing arbitrary file read via `../` sequences.
**Learning:** Even when using `path.join`, if the last argument is an absolute path or contains traversal sequences, it can escape the intended directory.
**Prevention:** Always use `path.basename()` on user-provided filenames before joining them to a base directory to ensure they refer only to a file within that directory. Additionally, verify that the resulting path is a file and not a directory using `fs.stat()`.
