---
name: release-readiness
description: Check whether a change or application release is ready by reviewing tests, security, configuration, observability, and rollback.
---

# Release Readiness

1. Identify the exact release scope, target environment, and deployment method.
2. Verify tests and any checks the project actually supports from actual command output. This project has no lint, typecheck, or build; use `node --test test/core.test.mjs` and `node --check app.js core.js sw.js`.
3. Review environment variable names and required configuration without printing secret values.
4. Review migrations for ordering, locks, data loss, backward compatibility, and rollback strategy only if the project has them; this project has no database migrations.
5. Verify auth, authorization, storage permissions, cron, and webhook protections. Tenant isolation applies only if multi-tenant storage exists.
6. Check logging and monitoring are useful without recording secrets or sensitive personal data.
7. Confirm health checks, failure handling, and operational runbooks exist where needed.
8. Identify deployment dependencies and any manual steps.
9. Classify blockers separately from warnings and follow-up improvements.
10. Never deploy, migrate production, rotate secrets, or modify infrastructure without explicit permission.
