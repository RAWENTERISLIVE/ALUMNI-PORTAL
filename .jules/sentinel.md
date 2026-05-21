## 2024-05-21 - Re-enabled rate limiting
**Vulnerability:** Rate limiting was effectively disabled across all environments because of a hardcoded `skip: () => true` bypass in the middleware configuration.
**Learning:** Hardcoded bypasses used during development can easily be forgotten and committed, leaving production systems vulnerable to DoS and brute-force attacks.
**Prevention:** Use environment-based checks for bypasses (e.g., `process.env.NODE_ENV === 'test'`) and ensure security features are never unconditionally disabled in source code.
