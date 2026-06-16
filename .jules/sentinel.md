# Sentinel's Journal

## 2025-05-14 - Mass Assignment in Profile Update
**Vulnerability:** The `updateProfile` function in `userController.ts` was using `data: { ...req.body }` directly, allowing users to update sensitive fields like `role`, `status`, and `isVerified`.
**Learning:** Even when validation middleware is present, the controller should explicitly whitelist fields for update to ensure defense in depth.
**Prevention:** Always use a whitelist for `Prisma` update operations instead of spreading `req.body`.
