## 2026-09-04 - Mass Assignment Vulnerability in Profile Updates
**Vulnerability:** Untrusted `req.body` object expansion (`...req.body`) in `updateProfile` enabled unprivileged users to modify restricted fields like `role`, `status`, or `isVerified`.
**Learning:** Expanding `req.body` directly into database update queries bypasses schema level protections and leads to privilege escalation risks.
**Prevention:** Always maintain an explicit whitelist constant of allowed fields (`allowedFields`) and construct update payloads conditionally.
