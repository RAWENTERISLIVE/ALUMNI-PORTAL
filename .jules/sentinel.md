# Sentinel Security Journal 🛡️

## 2025-10-08 - Mass Assignment Prevention in Group Creation
**Vulnerability:** A mass assignment vulnerability was identified in the group creation controller (`createGroup` in `groupController.ts`), where the spread operator `...req.body` allowed client requests to inject arbitrary data into the group database record, potentially overwriting internal system-managed fields such as `memberCount`, `creatorId`, `createdAt`, `updatedAt`, or `lastActivity`.
**Learning:** Overreliance on convenience shortcuts like the spread operator (`...req.body`) in database creation and update queries introduces major risks, allowing malicious users to escalate privileges, hijack model state, or inject unvalidated attributes.
**Prevention:** Strictly destructure and extract user-modifiable parameters from request bodies. Map those parameters into a clean, explicit input object, and populate system-managed fields using server-side validated context (like `req.user`).
