---
name: RTL Tailwind alignment in tennis-ranya
description: How logical Tailwind alignment classes resolve in this RTL app, and the systematic misuse to watch for
---

# RTL alignment in tennis-ranya (Kurdish Sorani)

The document is genuinely RTL: `index.html` has `<html lang="ku" dir="rtl">`, confirmed by logical props at runtime (e.g. `start-3` renders on the right; a DOM-2nd grid child renders on the left).

**Consequence of RTL:** Tailwind logical classes flip:
- `text-end` → LEFT, `text-start` → RIGHT
- `justify-end` → LEFT, `justify-start` → RIGHT
- `flex-row-reverse` → visually LTR (first child on the left)

**The trap:** much of the original UI was written with `text-end` / `justify-end` / `flex-row-reverse` as if they meant "right". In an RTL doc they push content to the LEFT. So when a user asks to "put headers/sections on the right", the fix is to switch those to `text-start` / `justify-start` and remove `flex-row-reverse`.

**Why:** the dev mentally mapped end→right (true only in LTR). Reports page was corrected this way; other pages may still have the same latent bug.

**How to apply:** for "move X to the right (natural RTL start)" requests in this app, prefer `text-start`/`justify-start` and drop `flex-row-reverse`. To verify direction without logging in, check a logical prop in a screenshot (e.g. where `start-*` positioned elements land).

**Auth note for testing:** login is role + password only (no username); the dev password in replit.md (admin123) did not work in a recent test, so the logged-in Reports view could not be screenshotted by the testing subagent.
