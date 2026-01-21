<h1 align="center"><img width="50" height="50" alt="Cereb logo" src="https://cereb.dev/logo-square-light.svg" /><br/>Cereb</h1>
<h3 align="center">An open source interaction library<br />for composable gesture and event streams</h3>
<p align="center">
  <a href="https://www.npmjs.com/package/cereb" rel="noopener noreferrer nofollow" ><img src="https://img.shields.io/npm/v/cereb?color=0368FF&label=version" alt="npm version"></a>
  <img alt="NPM License" src="https://img.shields.io/npm/l/cereb?color=FF2B6E">
</p>

```bash
npm install --save cereb
```

[Learn how to use Cereb in your project](https://cereb.dev).

## Table of Contents

1. [Why Cereb?](#why-cereb)
3. [Examples](#-examples)
5. [License](#license)
6. [Contribute](#contributing)

### Examples

```typescript
import { pinch } from "cereb";
import { zoom } from "cereb/operators";

let scale = 1.0;
const MIN_SCALE = 0.5, MAX_SCALE = 3.0;

// pipe creates a pipeline where signals flow through operators
// Each operator extends the signal (signals are immutable)
pinch(element)
  // Operator: Convert ratio to scale delta
  .pipe(zoom())
  .on((signal) => {
    // zoom outputs frame-by-frame delta, accumulate and clamp
    scale += signal.value.scale;
    scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
    element.style.transform = `scale(${scale})`;
  });
```

[See all Examples and Demo →](https://cereb.dev/examples/space-adventure)

## Why Cereb?

- **No Abstraction for Event Flow** — DOM events lack structure for state, dependencies, and composition
- **Lightweight Bundle** — ~77% smaller than Hammer.js (1.73 KB gzipped for pan gesture)
- **Resource Efficiency** — Event listener reuse, single-responsibility operators

[See detailed examples →](https://cereb.dev/core-concepts/the-problem-solves)

## Documentation

You can find the Cereb documentation [on the website](https://cereb.dev).

- **Core Concepts**
    - [Key Models](https://cereb.dev/core-concepts/key-models/)
    - [Behavior & Event](https://cereb.dev/core-concepts/behavior-and-event/)
    - [Creating Operators](https://cereb.dev/core-concepts/creating-operators/)
    - [High-Order Operators](https://cereb.dev/core-concepts/higher-order-operators/)
    - [The Problem Solves](https://cereb.dev/core-concepts/the-problem-solves/)
- **API Reference**
    - [Stream](https://cereb.dev/stream-api/pan/)
    - [Operators](https://cereb.dev/operator-api/compose/)

## Contributing

If you find Cereb useful, consider giving it a star — it helps others discover the project!

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) before submitting a Pull Request.

## License

Cereb is [MIT licensed](./LICENSE).
