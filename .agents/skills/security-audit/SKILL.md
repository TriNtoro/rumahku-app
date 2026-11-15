---
name: security-audit
description: Audit authentication, authorization, data exposure, secrets, local and Google Drive storage, and deployment configuration. Use for security reviews and before production releases.
---

# Security Audit

This project is a static PWA: no server, no database, no multi-tenant workspaces. Data lives in `localStorage`, IndexedDB, and optionally Google Drive `appDataFolder`. Tenant, RLS, and API checks apply only if that stack is added.

1. Map trust boundaries, sensitive data, roles, and external integrations. Here that means the browser, the device, Google Identity Services, and Google Drive.
2. Trace authentication and authorization from user action to local storage and Google Drive operations.
3. For every record and Drive file, verify ownership and scope. Tenant scoping and RLS apply only if a database is added.
4. Check IDOR, privilege escalation, mass assignment, injection, CSRF, XSS, SSRF, unsafe redirects, and rate-limit gaps where relevant.
5. Check session creation, rotation, expiry, revocation, cookie flags, password hashing, and recovery flows.
6. Check secrets are not committed, logged, returned by APIs, or exposed to client bundles.
7. Check uploads, downloads, presigned URLs, object ownership, MIME/type validation, size limits, and expiry.
8. Check cron/job endpoints, webhook signatures, replay protection, idempotency, and failure behavior.
9. Give evidence with exact file and line references. Separate confirmed vulnerabilities from risks needing runtime verification.
10. Never run destructive tests, access production data, expose secrets, or change security controls without permission.
