## 2026-06-07 - [Enhanced Rate Limiting for Authentication and Global Protection]
**Vulnerability:** Missing or bypassed rate limiting on sensitive authentication endpoints (/login, /register, /forgot-password, /reset-password) and lack of global rate limiting.
**Learning:** Rate limiters were implemented but explicitly bypassed with 'skip: () => true' and not applied to routes, leaving the application vulnerable to brute-force and DoS attacks.
**Prevention:** Ensure rate limiters are active in production/development and correctly applied to all sensitive endpoints and globally as a baseline defense.
