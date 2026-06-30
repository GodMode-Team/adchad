---
name: probe-exclusion-tag-all-readers
description: When a diff adds a column/tag to EXCLUDE rows from public surfaces, grep EVERY reader of that table — not just the one the diff patched.
metadata:
  type: feedback
---

When a diff introduces a new column or channel value whose purpose is to keep rows OFF public surfaces (e.g. `orders.source='launch'` excluded from sales counts; `interactions.channel='launch'` off the /live feed; earlier: `email_source='inbound'` off the feed), do not stop at the one reader the diff patched. Grep every reader of that table and confirm the exclusion holds at each.

**Why:** the diff author patches the one surface they were thinking about (e.g. `db metrics`) and leaves sibling readers (halls/gallery/page/fixstatus/feed/email/fulfill) unguarded. The leak escapes precisely where nobody looked. This has recurred: spec-09 inbound-feed-exclusion and spec-14 launch order/marker exclusion.

**How to apply:** `grep -rn "from <table>\|<table> where\|channel=\|<newcol>" tools/ app/ scripts/ lib/ --include="*.ts" --include="*.tsx" | grep -v test`, then for each hit confirm the WHERE clause excludes the tagged rows (or that inclusion is intended public work — e.g. a launch fix legitimately showing in Hall of Fame is a public showcase, not a sales-count leak; distinguish "sales/revenue counter" from "showcase"). The central mapper (`interactionEvent`) catches feed rows, but raw-SQL readers bypass it — those are where leaks hide. Pairs with [[probe-live-db-readonly]] (you verify by reading every reader, not by running the live-DB suite).
