# Sentinel Security Journal

## 2025-05-15 - [Mass Assignment Protection in User Profile]
**Vulnerability:** Mass assignment vulnerability in `updateProfile` function of `userController.ts` due to use of spread operator (`...req.body`) on Prisma update data.
**Learning:** Directly spreading request bodies into database update calls allows attackers to modify sensitive fields (like `role`, `status`, `isVerified`) that should be restricted to administrators.
**Prevention:** Always use a strict whitelist of allowed fields when updating models from user-supplied input.
