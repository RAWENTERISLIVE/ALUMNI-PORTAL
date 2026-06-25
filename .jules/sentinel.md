## 2026-06-25 - [Mass Assignment in updateProfile]
**Vulnerability:** Mass assignment in the `updateProfile` controller allowed any authenticated user to potentially overwrite sensitive database fields (like `role` or `isVerified`) by including them in the request body.
**Learning:** The application relied on the spread operator (`{ ...req.body }`) for Prisma updates in several controllers, providing no input filtering.
**Prevention:** Always use a whitelist to extract only permitted fields from the request body before passing data to database update functions.
