## 2025-05-26 - Mass Assignment in User Profile Updates
**Vulnerability:** Mass Assignment (Overposting) in `updateProfile` function.
**Learning:** The `updateProfile` function was using `...req.body` directly in a Prisma `update` call, allowing users to potentially modify sensitive fields like `role`, `status`, or `isVerified` which are stored in the same model.
**Prevention:** Always use an explicit whitelist of allowed fields when updating records based on user-provided input, especially when the model contains both public and administrative fields.
