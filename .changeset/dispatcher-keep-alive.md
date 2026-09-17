---
'fetchcustom-vsm': minor
---

feat: add `dispatcher` option (constructor-level default and per-call override) to plug in a Node/undici `Agent` for tuning keep-alive/connection pooling. Native `fetch` already keeps connections alive by default; this only matters if you want to customize that behavior (pool size, keep-alive timeout, or route through an `undici.ProxyAgent`).
