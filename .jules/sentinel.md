# Sentinel Security Journal

## 2025-05-22 - Mass Assignment Protection in Group Creation
**Vulnerability:** Mass assignment vulnerability in `createGroup` endpoint where `...req.body` was used directly in Prisma create call.
**Learning:** Spread operator (`...req.body`) in database creation/update calls allows clients to inject unauthorized fields.
**Prevention:** Always use an explicit whitelist of allowed fields from the request body when creating or updating records.
