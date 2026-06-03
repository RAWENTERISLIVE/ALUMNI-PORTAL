## 2024-06-03 - [Vulnerability] Mass Assignment in eventController
**Vulnerability:** Mass assignment in `createEvent` and `updateEvent` functions in `backend/src/controllers/eventController.ts`.
**Learning:** Using `...req.body` directly in Prisma/ORM calls allows attackers to inject internal fields (like `organizerId` or `status`) that should only be set by the system or authorized admins.
**Prevention:** Always use a strict whitelist of allowed fields when creating or updating records from user input.
