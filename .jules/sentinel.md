## 2026-07-12 - Mass Assignment Protection in Report Controller

**Vulnerability:** A mass assignment vulnerability was identified in the `createReport` function in `backend/src/controllers/reportController.ts`. The function used the spread operator (`...req.body`) to create a new report, allowing users to potentially set administrative fields such as `status`, `adminNotes`, `reviewedById`, and `reviewedAt`.

**Learning:** Using the spread operator directly on user-controlled input when interacting with a database ORM (like Prisma) can lead to mass assignment vulnerabilities if sensitive or system-managed fields are part of the model.

**Prevention:** Always use a whitelist of allowed fields when creating or updating records based on user input. Manually extract the needed fields or use a helper function to filter the input object before passing it to the database layer.
