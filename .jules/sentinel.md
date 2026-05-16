## 2026-05-16 - [Mass Assignment in User Profile Update]
**Vulnerability:** The `updateProfile` function in `userController.ts` spreads `req.body` directly into a Prisma update call.
**Learning:** This allows users to modify sensitive fields like their own `role`, `status`, or `isVerified` status by including them in the request body.
**Prevention:** Always use a whitelist of allowed fields when updating records from user-provided input.
