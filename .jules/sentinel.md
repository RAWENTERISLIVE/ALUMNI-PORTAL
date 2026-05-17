# Sentinel Security Journal 🛡️

## 2026-05-17 - [CRITICAL] Mass Assignment in Profile Update
**Vulnerability:** The `updateProfile` function in `userController.ts` used `{ ...req.body }` directly in a Prisma `update` call. This allowed any authenticated user to modify sensitive fields like `role`, `status`, and `isVerified` by including them in the request body.
**Learning:** Using spread operators on request bodies for database updates is extremely dangerous as it bypasses intended access controls and allows users to modify internal state.
**Prevention:** Always use a strict whitelist of allowed fields when updating records from user-provided input.
