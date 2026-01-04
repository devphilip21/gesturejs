# feat(tap): add tap gesture recognition with multi-tap support

## Summary
- Add new `@cereb/tap` package for tap gesture recognition
- Support multi-tap detection (single, double, triple taps, etc.)
- Add double-tap zoom gesture to space adventure example

## Features

### Operators
- `tapRecognizer()` - Full lifecycle operator emitting `start`, `end`, and `cancel` phases
- `tapEndOnly()` - Simplified operator that only emits successful tap events
- `tap()` - Convenience function that creates a tap stream from an element

### Configuration Options
| Option | Default | Description |
|--------|---------|-------------|
| `movementThreshold` | 10px | Max movement allowed during tap |
| `durationThreshold` | 500ms | Max duration for a valid tap |
| `chainMovementThreshold` | movementThreshold | Max distance between consecutive taps |
| `chainIntervalThreshold` | durationThreshold / 2 | Max interval between consecutive taps |

### TapSignal Value
- `phase`: Tap lifecycle phase (`start`, `end`, `cancel`)
- `x`, `y`: Client coordinates
- `pageX`, `pageY`: Page coordinates
- `tapCount`: Consecutive tap count (1=single, 2=double, etc.)
- `duration`: How long the pointer was pressed (ms)
- `pointerType`: Type of pointer (`mouse`, `touch`, `pen`)

## Usage Example
```typescript
import { tap } from "@cereb/tap";

tap(element, { chainIntervalThreshold: 300 })
  .on((signal) => {
    if (signal.value.tapCount === 2) {
      console.log("Double tap detected!");
    }
  });
```

## Test Plan
- [x] Unit tests for tap recognizer state machine
- [x] Unit tests for geometry calculations
- [x] Unit tests for tap recognition scenarios (single, double, triple taps)
- [x] Integration with docs site (space adventure double-tap zoom)
