---
name: code-review
description: Review code changes for correctness, regressions, maintainability, and project conventions. Use when reviewing a PR, diff, implementation, or asking whether code is ready.
---

# Code Review

1. Read the relevant `AGENTS.md` and nearby implementation before reviewing. This project has no `package.json`; use `node --test test/core.test.mjs` and `node --check app.js core.js sw.js` for verification.
2. Review the actual diff and trace changed behavior through callers, consumers, and tests.
3. Prioritize findings by severity: Critical, High, Medium, Low.
4. Report only actionable findings. For each: explain impact, exact file and line, reproduction or failure path, and a minimal fix.
5. Check edge cases, validation, authorization, error handling, data consistency, and backward compatibility.
6. Do not report style preferences as defects unless they violate an explicit project convention.
7. Do not modify files unless explicitly asked.
8. If no actionable issue is found, say so and list what was not checked.
