---
name: performance
description: Investigate and improve runtime, frontend, storage, and network performance using evidence rather than premature optimization.
---

# Performance

1. Establish the affected user flow and measure a baseline before changing code.
2. Identify whether the bottleneck is rendering, network, storage, CPU, memory, or external service latency. This project has no database; measure `localStorage`, IndexedDB, and Google Drive calls where relevant.
3. Prefer measured timings and profiling over assumptions.
4. Check oversized payloads, repeated work, unnecessary re-renders, and unnecessary client work. Database-specific checks apply only if a database is added.
5. Optimize the measured bottleneck with the smallest change.
6. Preserve authorization, correctness, and data consistency; never remove safeguards for speed.
7. Compare before/after measurements using the same conditions.
8. Add caching only with explicit ownership, invalidation, and freshness rules.
9. Avoid speculative indexes, abstractions, or infrastructure changes.
10. Report measured impact and trade-offs; state when no reliable benchmark was possible.
