# Sentinel Security Journal

## 2025-05-15 - Path Traversal Prevention in File Serving

**Vulnerability:** The `serveFile` controller in `uploadController.ts` was directly using the `filename` request parameter to construct a file path via `path.join()`. This allowed an attacker to use relative path components like `../` to access files outside the intended `uploads/` directory.

**Learning:** Even when using `path.join()` with a base directory, user-provided path components must be sanitized to strip directory information. Relying only on `fs.existsSync()` is insufficient if the attacker can navigate to sensitive system files.

**Prevention:** Always use `path.basename()` on user-provided filenames before joining them with a base directory. Additionally, replace backslashes with forward slashes before applying `path.basename()` to ensure cross-platform consistency (e.g., handling Windows-style paths on a Linux server). Finally, verify that the resulting path resolves to a file (not a directory) using `fs.statSync().isFile()`.
