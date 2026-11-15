---
name: frontend-design
description: Build and improve application UI with accessible, responsive, consistent components and clear interaction states.
---

# Frontend Design

1. Inspect existing routes, components, design tokens, and styling conventions before creating UI.
2. Reuse existing components and dependencies; do not introduce a new UI framework without approval.
3. Build the smallest complete user flow requested, not a speculative dashboard or feature set.
4. Cover loading, empty, success, validation, error, and permission-denied states.
5. Make layouts responsive for mobile, tablet, and desktop.
6. Use semantic HTML, keyboard-accessible controls, visible focus states, and labels for form fields.
7. Keep business logic out of presentation components where the project already has a separation pattern.
8. Avoid fake data in production paths. Clearly label fixtures and demo data.
9. Verify forms, navigation, dialogs, and destructive actions behave correctly.
10. Run the checks this project actually has: `node --test test/core.test.mjs`, `node --check app.js core.js sw.js`, and the relevant UI tests under `docs/handover/ui-tests/`; report checks not run.
