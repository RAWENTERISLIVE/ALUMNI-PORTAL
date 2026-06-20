## 2025-06-20 - [Mass Assignment Protection in User Profile Updates]
**Vulnerability:** Mass assignment vulnerability in `userController.ts` via the `updateProfile` function. The code was using `data: { ...req.body }` directly, allowing users to potentially modify sensitive fields like `role`, `status`, or `hasPremiumBadge` by including them in the request body.
**Learning:** Using spread operators on request bodies when performing database updates is a common pattern that leads to mass assignment vulnerabilities if not carefully controlled.
**Prevention:** Always use an explicit whitelist of allowed fields when updating models from user-supplied input. In this case, fields like `role`, `status`, and system-managed flags were excluded from the `updateProfile` whitelist.

## 2025-06-20 - [Path Traversal in File Serving]
**Vulnerability:** Path traversal vulnerability in `uploadController.ts` via the `serveFile` function. The code was using `req.params.filename` directly in `path.join()`, allowing an attacker to access arbitrary files on the server using `../` sequences.
**Learning:** Directly using user-supplied parameters in file system path construction is highly dangerous.
**Prevention:** Always sanitize filenames using `path.basename()` and handle potential platform-specific directory separators (like backslashes from Windows clients) before constructing paths.
