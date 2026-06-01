## 2025-05-15 - [Mass Assignment in User Profile Update]
**Vulnerability:** The `updateProfile` function in `userController.ts` used `...req.body` directly in a Prisma `update` call, allowing users to modify sensitive fields like `role`, `status`, or `isVerified`.
**Learning:** Even when using modern ORMs like Prisma, direct spread of request bodies into database operations remains a common source of mass assignment vulnerabilities. Whitelisting is the most robust defense.
**Prevention:** Always use an explicit whitelist of allowed fields when performing updates or creations based on user-provided input. Avoid using spread operators (`...req.body`) for database operations.
