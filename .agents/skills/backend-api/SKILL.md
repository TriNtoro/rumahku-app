---
name: backend-api
description: Implement or review backend services, route handlers, validation, authorization, API contracts, and error responses. Use only when the project actually has a backend.
---

# Backend API
This project is currently a static PWA with no backend, database server, or API. Apply this skill only if a backend is added; otherwise use `frontend-design`, `testing-qa`, and `debugging`.


1. Follow existing route, service, repository, and validation patterns; do not add layers without need.
2. Validate all untrusted input at the API boundary with the project's established schema library.
3. Authenticate first, then authorize the requested action and workspace/resource ownership.
4. Never trust workspace IDs, user IDs, roles, or ownership supplied by the client without server-side verification.
5. Keep API responses stable and avoid returning internal errors, SQL details, tokens, or private fields.
6. Use the project's standard error format and correct HTTP status codes.
7. Make mutations transactional when multiple writes must succeed together.
8. Use idempotency for retryable operations where duplicate execution could cause harm.
9. Keep OpenAPI documentation and tests aligned with actual behavior.
10. Add focused tests for success, invalid input, unauthenticated, unauthorized, not-found, and conflict cases as applicable.
