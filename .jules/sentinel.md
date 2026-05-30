## 2025-05-15 - [Mass Assignment Vulnerability in userController.ts]
**Vulnerability:** The `updateProfile` function in `userController.ts` was using `...req.body` directly in a Prisma update call, allowing users to potentially modify sensitive fields like `role`, `status`, or `isVerified`.
**Learning:** Using spread operators on request bodies for database updates without whitelisting is a common source of privilege escalation vulnerabilities.
**Prevention:** Always use a whitelist of allowed fields when performing updates based on user-provided data.
