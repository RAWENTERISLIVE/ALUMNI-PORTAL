# Sentinel's Journal - Critical Security Learnings

## 2025-05-15 - [Mass Assignment Protection]
**Vulnerability:** User profile update allowed updating any field in the User model, including roles and account status, by spreading `req.body` into the Prisma update call.
**Learning:** This is a common pitfall when using modern ORMs like Prisma. Even with frontend validation and API-level validation (like `express-validator`), if the controller doesn't explicitly whitelist fields before passing them to the ORM, an attacker can bypass these checks by sending extra fields in the JSON payload.
**Prevention:** Always use an explicit whitelist of allowed fields in controllers before passing data to ORM update/create methods.

## 2025-05-15 - [Tool Side Effects]
**Vulnerability:** Running `npm install` in the backend directory can lead to massive, unintended updates to `package-lock.json`, including major version upgrades (e.g., Express 4 to 5) that may break the application.
**Learning:** In a legacy or partially updated environment, `npm install` might resolve to the latest versions instead of sticking to the current ones if the lockfile isn't perfectly synced. This can bundle dangerous breaking changes with a small fix.
**Prevention:** Always review `package-lock.json` changes carefully before committing. Use `git restore` to revert unintended dependency updates if they are not necessary for the task at hand.
