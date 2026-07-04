# 🛡️ Sentinel Security Journal

This journal documents critical security learnings, vulnerability patterns, and prevention strategies identified during security audits and fixes.

## 2025-05-14 - Path Traversal Prevention in File Serving

**Vulnerability:** Path traversal in `serveFile` controller allowed attackers to access files outside the intended `uploads/` directory by using `../` in the `filename` parameter.

**Learning:** `path.join` with unsanitized user input is dangerous. Even on Linux, Windows-style backslashes (`\`) might not be correctly handled by `path.basename()` if it's running on a POSIX system, potentially allowing bypasses.

**Prevention:** Always use `path.basename()` to extract only the filename. Additionally, replace backslashes with forward slashes before applying `path.basename()` for cross-platform robustness. Verify that the resolved path is a file and not a directory using `fs.statSync(filePath).isFile()`.
