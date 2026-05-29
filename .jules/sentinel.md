## 2025-05-21 - [Path Traversal in uploadController]
**Vulnerability:** User-provided filename in the `serveFile` function was used directly to construct a file path without sanitization, allowing potential path traversal attacks.
**Learning:** Even simple file-serving endpoints can be vulnerable if they directly use URL parameters to access the filesystem.
**Prevention:** Always use `path.basename()` to sanitize user-provided filenames before using them in file path construction, and verify the parameter type.
