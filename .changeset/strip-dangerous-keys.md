---
'fetchcustom-vsm': minor
---

feat: add opt-in `stripDangerousKeys` option to recursively remove `__proto__`/`constructor`/`prototype` keys from object/array bodies before serializing them, as defense-in-depth when calling a downstream API that unsafely merges its request body
