## 2024-05-23 - [Mass Assignment Prevention in Report Creation]
**Vulnerability:** The `createReport` endpoint in `reportController.ts` used the spread operator (`...req.body`) to create a new report, allowing users to potentially overwrite sensitive fields like `status`, `adminNotes`, or `reviewedById`.
**Learning:** Spread operators on `req.body` for database creation or update operations are a primary source of mass assignment vulnerabilities, especially when the Prisma model contains both user-controllable and system-managed fields.
**Prevention:** Always use a strict whitelist for fields extracted from the request body. A mapping loop over an `allowedFields` array is a clean and maintainable way to enforce this.
