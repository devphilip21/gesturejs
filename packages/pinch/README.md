# @cereb/pinch

> **DEPRECATED**: This package is deprecated. Please use [`cereb/pinch`](https://www.npmjs.com/package/cereb) instead.

## Migration

```bash
# Remove the old package
npm uninstall @cereb/pinch

# Install cereb (if not already installed)
npm install cereb
```

Update your imports:

```diff
- import { pinch, pinchRecognizer, createPinchRecognizer } from "@cereb/pinch";
+ import { pinch, pinchRecognizer, createPinchRecognizer } from "cereb/pinch";
```

## Why?

All gesture recognizers are now included in the main `cereb` package as subpath exports. This simplifies dependency management and ensures better compatibility.

## Documentation

For the latest documentation, visit [cereb.dev/stream-api/pinch](https://cereb.dev/stream-api/pinch).
