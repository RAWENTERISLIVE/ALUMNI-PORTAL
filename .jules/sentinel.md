## 2025-05-14 - [Mass Assignment in Report Creation]
**Vulnerability:** The `createReport` controller was using `...req.body` to create new reports, allowing users to potentially set administrative fields like `status` or `adminNotes`.
**Learning:** Using spread operators on request bodies directly in database create/update calls is a common pattern that leads to mass assignment vulnerabilities when the model contains both user-controlled and system-controlled fields.
**Prevention:** Always use explicit field whitelisting in controllers. Destructure allowed fields from `req.body` and pass only those to the database layer.
