## 2025-06-20 - [Mass Assignment Protection in User Profile Updates]
**Vulnerability:** Mass assignment vulnerability in `userController.ts` via the `updateProfile` function. The code was using `data: { ...req.body }` directly, allowing users to potentially modify sensitive fields like `role`, `status`, or `hasPremiumBadge` by including them in the request body.
**Learning:** Using spread operators on request bodies when performing database updates is a common pattern that leads to mass assignment vulnerabilities if not carefully controlled.
**Prevention:** Always use an explicit whitelist of allowed fields when updating models from user-supplied input. In this case, fields like `role`, `status`, and system-managed flags were excluded from the `updateProfile` whitelist.
