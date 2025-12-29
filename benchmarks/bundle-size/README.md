# Bundle Size Benchmark

Compares bundle size between Cereb and Hammer.js for equivalent pan gesture functionality.

## Run

```bash
pnpm install
node build.mjs
```

## Results

| Library | Minified | Gzipped |
|---------|----------|---------|
| cereb + @cereb/pan | 4.58 KB | 1.73 KB |
| hammerjs | 20.98 KB | 7.52 KB |

**Cereb is ~23% the size of Hammer.js** for equivalent pan gesture functionality.

## Methodology

Both implementations:
- Subscribe to pan gestures on an element
- Apply transform on move
- Log velocity on end

The builds use esbuild with:
- `bundle: true`
- `minify: true`
- `treeShaking: true`
- `format: "esm"`
- `target: "es2020"`
