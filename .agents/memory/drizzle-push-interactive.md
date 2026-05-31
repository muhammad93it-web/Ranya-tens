---
name: Drizzle push is interactive in this repo
description: Why `pnpm --filter @workspace/db run push` hangs and how to add tables instead
---

# Drizzle push hangs on TTY prompts

`pnpm --filter @workspace/db run push` (drizzle-kit push) blocks waiting for
interactive resolver prompts (e.g. "is this a new table or a rename?") and never
completes from the agent shell, which has no TTY.

**Why:** drizzle-kit push prompts on ambiguous schema diffs; there's no
non-interactive flag wired up here that auto-confirms.

**How to apply:** To add/alter a table in dev, write the Drizzle schema file
(under `lib/db/src/schema/`, export it from the schema index) AND create the
table directly with raw SQL via the code_execution `executeSql` callback. Verify
with a `SELECT` against the table. For production rollout, the deploy step still
needs the table created — don't assume push ran.
