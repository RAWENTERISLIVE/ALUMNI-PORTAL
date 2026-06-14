## 2025-05-15 - [Mass Assignment Vulnerability in Profile and Event Updates]
**Vulnerability:** Several controllers used `...req.body` directly in Prisma update and create calls, allowing users to modify restricted fields (e.g., `role`, `status`, `organizerId`).
**Learning:** Using the spread operator on request bodies is a common anti-pattern that leads to mass assignment vulnerabilities, especially in ORMs like Prisma that don't have built-in field whitelisting by default.
**Prevention:** Always implement explicit whitelisting by destructuring only the allowed fields from `req.body` or using a dedicated validation/DTO layer before passing data to database operations.
