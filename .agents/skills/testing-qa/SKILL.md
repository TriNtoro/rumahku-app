---
name: testing-qa
description: Plan and run focused tests, regression checks, syntax checks, and any validation the project actually supports.
---

# Testing and QA

1. Read the project's actual test conventions before choosing commands. This project has no `package.json`, lint, typecheck, or build; use `node --test test/core.test.mjs` and `node --check app.js core.js sw.js`.
2. Identify the changed behavior and its highest-risk failure modes.
3. Prefer a focused regression test that fails before the fix and passes after it.
4. Cover normal behavior, boundary values, invalid input, permission failures, and failure/retry paths where relevant.
5. Keep tests deterministic; avoid real external services unless the test suite explicitly uses them.
6. Use fixtures and factories already present in the project.
7. Run the narrowest relevant test first, then other checks the project actually supports. Do not invent lint, typecheck, or build steps.
8. Never claim a test passed unless the command actually completed successfully.
9. Report exact commands and concise results, including skipped checks and environment blockers.
10. Do not weaken or delete tests merely to make a change pass.
