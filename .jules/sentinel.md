# Sentinel Security Journal - Critical Learnings

## 2026-08-31 - Mass Assignment Protection in User Profile Update
**Vulnerability:** The `updateProfile` function in `backend/src/controllers/userController.ts` used `{ ...req.body }` inside Prisma's `user.update` call, allowing arbitrary request fields to be passed directly to the database.
**Learning:** Even if route middleware restricts general user access, allowing un-whitelisted `req.body` in profile updates allows low-privilege users to modify administrative or restricted fields (such as `role`, `status`, `isVerified`, or `hasPremiumBadge`).
**Prevention:** Always define an explicit whitelist of allowed user-modifiable properties and iterate through `allowedFields` to populate `updateData` when updating user profiles or core entities.
