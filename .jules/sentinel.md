## 2025-05-15 - Mass Assignment Protection in User Profile

**Vulnerability:** The `updateProfile` function in `userController.ts` used the spread operator (`...req.body`) to pass all incoming request data directly to the Prisma `update` call. This allowed authenticated users to potentially update sensitive fields like `role`, `status`, or `isVerified`, leading to privilege escalation.

**Learning:** Using the spread operator on `req.body` is a common but dangerous pattern in Prisma-based applications. While it's concise, it bypasses the security boundary between user-provided data and the database schema. Explicitly whitelisting allowed fields is necessary for any update or create operation that takes user input.

**Prevention:** Always implement a strict whitelist of allowed fields when performing database updates from request bodies. Use a clean `updateData` object and only populate it with validated and authorized fields. This should be a standard pattern across all controllers in the project.
