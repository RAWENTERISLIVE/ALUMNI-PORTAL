# Sentinel Security Journal 🛡️

## 2026-05-24 - Mass Assignment Vulnerability Prevention in Event Controllers
**Vulnerability:** Mass Assignment vulnerabilities in `createEvent` and `updateEvent` handlers. The API endpoints used the raw `req.body` directly inside Prisma Client queries, making it possible for attackers or users to overwrite internal/system-defined fields such as `id`, `organizerId`, `status`, `createdAt`, or `updatedAt`.
**Learning:** Using ES6 spread operator (`...req.body`) or directly passing request bodies to Prisma queries bypasses strict input validation and schema restrictions. This is a common architectural pattern in rapid prototyping that introduces major security flaws once deployed.
**Prevention:** Always implement an explicit whitelist and map values from request bodies. Ensure numeric fields (like `maxAttendees`) handle `undefined`, `null`, and empty strings correctly, and convert all date and boolean types explicitly before passing them to the database layers.
