# @cereb/pan

> **DEPRECATED**: This package is deprecated. Please use [`cereb/pan`](https://www.npmjs.com/package/cereb) instead.

## Migration

```bash
# Remove the old package
npm uninstall @cereb/pan

# Install cereb (if not already installed)
npm install cereb
```

Update your imports:

```diff
- import { pan, panRecognizer } from "@cereb/pan";
- import { axisLock } from "@cereb/pan/operators";
+ import { pan, panRecognizer, axisLock } from "cereb/pan";
```

## Why?

All gesture recognizers are now included in the main `cereb` package as subpath exports. This simplifies dependency management and ensures better compatibility.

## Documentation

For the latest documentation, visit [cereb.dev/stream-api/pan](https://cereb.dev/stream-api/pan).
