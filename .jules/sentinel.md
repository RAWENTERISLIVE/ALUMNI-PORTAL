## 2025-05-23 - [HIGH] Mass Assignment in User Profile Update
**Vulnerability:** The `updateProfile` function in `userController.ts` used a spread operator (`...req.body`) directly in the Prisma `update` call, allowing users to modify sensitive fields like `role`, `status`, and `isVerified`.
**Learning:** This pattern existed because it's a convenient way to implement partial updates, but it fails to enforce boundaries between user-modifiable profile data and system-controlled account metadata.
**Prevention:** Always use an explicit whitelist of allowed fields when performing database updates from user-provided request bodies. Do not use spread operators or `Object.assign` directly on `req.body` for sensitive models.
