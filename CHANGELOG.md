# fetchcustom

## 3.2.0

### Minor Changes

- 1f439d9: feat: add `dispatcher` option (constructor-level default and per-call override) to plug in a Node/undici `Agent` for tuning keep-alive/connection pooling. Native `fetch` already keeps connections alive by default; this only matters if you want to customize that behavior (pool size, keep-alive timeout, or route through an `undici.ProxyAgent`).

## 3.1.0

### Minor Changes

- 8f1c760: feat: support optional `bodySchema` to serialize request bodies with a compiled `fast-json-stringify` function; split CI into separate build and test jobs so a failing test surfaces as its own check
- a25a6e0: feat: add opt-in `stripDangerousKeys` option to recursively remove `__proto__`/`constructor`/`prototype` keys from object/array bodies before serializing them, as defense-in-depth when calling a downstream API that unsafely merges its request body. Guarded with a max recursion depth so a deeply nested or circular body fails fast with a `ResponseError` instead of recursing indefinitely.
- ee7701f: feat: add timeout, retry, and request/response interceptor options to FetchCustom; fix real network errors (TypeError) not being handled and per-instance error state leaking across calls

## 3.0.1

### Patch Changes

- 39e8743: added config in package and format correct in edit config

## 3.0.0

### Major Changes

- 07359c8: feat: Improvements to ResponseError and DOMException handling tests

## 2.0.0

### Major Changes

- 270d1aa: delete tsup

## 1.0.0

### Major Changes

- 9a145ba: Prepare for initial release
