## 2026-06-28 - [Mass Assignment Protection in Report Controller]
**Vulnerability:** Mass assignment vulnerability in `createReport` where `req.body` was directly spread into the Prisma `create` call.
**Learning:** Directly spreading user-controlled input (`req.body`) into database operations allows attackers to modify internal or administrative fields (like `status`, `adminNotes`, `reviewedById`) that should only be controlled by the system or administrators.
**Prevention:** Always use an explicit whitelist of allowed fields when creating or updating records with user-provided data. Extract only the necessary properties from `req.body` before passing them to the database client.
