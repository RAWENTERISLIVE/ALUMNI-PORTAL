# Sentinel Security Journal 🛡️

## 2026-06-28 - [Mass Assignment Protection]
**Vulnerability:** Mass assignment in user profile updates.
**Learning:** Using `...req.body` (spread operator) in database updates allows users to modify internal or administrative fields (e.g., `role`, `status`, `isVerified`) if they are sent in the request body.
**Prevention:** Always use an explicit whitelist of allowed fields when performing updates based on user-supplied input.
