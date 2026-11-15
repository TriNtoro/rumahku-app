---
name: debugging
description: Diagnose bugs systematically, reproduce failures, identify root causes, and make the smallest verified fix.
---

# Debugging

1. Capture the exact error, expected behavior, actual behavior, and reproduction steps.
2. Reproduce the issue before editing whenever possible.
3. Trace the failing path through callers, data flow, configuration, and environment.
4. Check recent changes and compare working versus failing inputs.
5. Form one testable hypothesis at a time; use targeted logs or assertions without exposing secrets.
6. Fix the root cause rather than masking symptoms.
7. Add a regression test for non-trivial bugs.
8. Avoid unrelated refactors and broad dependency upgrades.
9. Re-run the reproduction and relevant regression suite after the fix.
10. Summarize root cause, changed files, verification, and any remaining uncertainty.
