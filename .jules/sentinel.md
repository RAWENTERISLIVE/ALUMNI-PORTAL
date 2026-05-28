## 2026-05-28 - [High] Fix Mass Assignment in eventController.ts
**Vulnerability:** Mass assignment vulnerability in `createEvent` and `updateEvent` where `...req.body` or `req.body` was passed directly to Prisma's `create` and `update` methods.
**Learning:** Using `...req.body` allows attackers to inject sensitive fields like `id`, `organizerId`, or `status` that should not be directly modifiable by users.
**Prevention:** Always use an explicit whitelist of allowed fields when creating or updating records from user input.
