# Signal Structure

## SinglePointer

```typescript
interface SinglePointer {
  type: "pointer";
  timestamp: number;
  deviceId: string;
  phase: PointerPhase;
  x: number;
  y: number;
  pointerType: PointerType;
  button: PointerButton;
  pressure: number; // 0.0 ~ 1.0
}
```

## Types

```typescript
type PointerPhase = "start" | "move" | "end" | "cancel";

type PointerType = "mouse" | "touch" | "pen" | "unknown";

type PointerButton =
  | "none"
  | "primary"
  | "secondary"
  | "auxiliary"
  | "back"
  | "forward";
```

## Phase

| Phase    | Description                                |
| -------- | ------------------------------------------ |
| `start`  | Pointer down (touch start, mouse down)     |
| `move`   | Pointer moved                              |
| `end`    | Pointer up (touch end, mouse up)           |
| `cancel` | Pointer cancelled (e.g. touch interrupted) |
