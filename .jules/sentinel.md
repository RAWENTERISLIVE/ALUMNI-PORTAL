## 2025-05-14 - [Fixed Mass Assignment in User Profile Updates]
**Vulnerability:** The `updateProfile` function in `userController.ts` was using the spread operator `...req.body` directly in the Prisma `update` call, allowing users to potentially modify sensitive internal fields like `role`, `status`, or `isVerified`.
**Learning:** Over-reliance on request body spreading without explicit filtering is a common source of mass assignment vulnerabilities in Express/Prisma applications.
**Prevention:** Always use a strict whitelist for fields that can be updated via public API endpoints, especially for user profile and administrative models.
