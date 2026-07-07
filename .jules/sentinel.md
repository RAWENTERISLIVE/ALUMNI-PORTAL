## 2025-05-15 - Mass Assignment Protection in User Profile Update
**Vulnerability:** Mass assignment vulnerability in `updateProfile` controller in `userController.ts` where `...req.body` was directly passed to Prisma's `update` method.
**Learning:** Using the spread operator on request bodies allows attackers to modify system-managed or sensitive fields (like `role`, `status`, or `isVerified`) that should only be changed by administrators.
**Prevention:** Always implement an explicit whitelist of allowed fields when performing updates based on user-provided input. Mapping over an `allowedFields` array is a clean and maintainable way to enforce this.
