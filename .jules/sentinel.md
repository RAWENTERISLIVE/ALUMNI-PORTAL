# Sentinel Security Journal 🛡️

## 2025-02-15 - Mass Assignment Protection in Prisma Group Creation
**Vulnerability:** Mass Assignment (Overposting) in `createGroup` endpoint.
**Learning:** Using the spread operator (`...req.body`) blindly in database creation allows clients to assign and override system-managed or restricted fields (such as `creatorId`, `memberCount`, or related entities). Whitelisting allowed input parameters ensures that only intended fields are sent to Prisma.
**Prevention:** Explicitly destructure permitted fields from the request body (`req.body`) and construct a clean input payload for the database operation. Always validate and sanitize user-provided values.
