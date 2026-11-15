---
name: database-design
description: Design and review relational schemas, migrations, indexes, constraints, transactions, RLS policies, and tenant isolation. Use only when the project actually has a database.
---

# Database Design
This project currently has no database server; data lives in `localStorage` and IndexedDB. Apply this skill only if a database is added, and never run migrations against production without explicit permission.


1. Read existing schema, migration conventions, DB helper utilities, and architecture decisions first.
2. Preserve naming, schema, migration ordering, and transaction conventions already used by the project.
3. Prefer database constraints for invariants: foreign keys, unique constraints, checks, and not-null rules.
4. For workspace-owned records, verify workspace ownership is represented and enforced consistently.
5. Review RLS policies for SELECT, INSERT, UPDATE, and DELETE separately; check USING and WITH CHECK.
6. Check joins and foreign keys cannot connect records across workspaces unintentionally.
7. Add indexes based on real query patterns, tenant filters, sort order, and foreign keys; avoid speculative indexes.
8. Migrations must be forward-safe, repeatable where the project requires it, and must not silently drop or rewrite user data.
9. Include migration tests or SQL assertions for important constraints and isolation behavior.
10. Do not execute migrations against production without explicit permission.
