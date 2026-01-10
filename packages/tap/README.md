# @cereb/tap

> **DEPRECATED**: This package is deprecated. Please use [`cereb/tap`](https://www.npmjs.com/package/cereb) instead.

## Migration

```bash
# Remove the old package
npm uninstall @cereb/tap

# Install cereb (if not already installed)
npm install cereb
```

Update your imports:

```diff
- import { tap, tapRecognizer, tapEndOnly, createTapRecognizer } from "@cereb/tap";
+ import { tap, tapRecognizer, tapEndOnly, createTapRecognizer } from "cereb/tap";
```

## Why?

All gesture recognizers are now included in the main `cereb` package as subpath exports. This simplifies dependency management and ensures better compatibility.

## Documentation

For the latest documentation, visit [cereb.dev/stream-api/tap](https://cereb.dev/stream-api/tap).
