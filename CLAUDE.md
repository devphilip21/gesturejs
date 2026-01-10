# Project Guidelines for Claude Code

## Project Overview

**Cereb** is a lightweight reactive stream library for user input modeling and orchestration. It provides a unified abstraction for handling pointer/touch/mouse events through an Observable-based pattern, enabling composable gesture recognition pipelines.

### Core Concepts

- **Signal**: Immutable data object containing `kind`, `value`, `deviceId`, and timestamps. All signals are readonly by design to prevent side-effects and enable safe composition.
- **Stream**: Observable-based event stream with built-in `block()`/`unblock()` control. Single observer by default; use `share()` for multicast.
- **Operator**: Functions that transform streams (e.g., `filter`, `map`, `session`, `offset`, `zoom`, `throttle`, `debounce`).

### Package Structure

| Package | NPM Name | Description |
|---------|----------|-------------|
| `packages/cereb` | `cereb` | Core library: Stream primitives, SinglePointer events, operators |
| `packages/pan` | `@cereb/pan` | Pan gesture recognition (drag/swipe with velocity, direction) |
| `packages/pinch` | `@cereb/pinch` | Pinch gesture recognition (two-finger zoom with distance/center) |
| `docs/` | `@cereb/docs` | Astro-based documentation site with interactive examples |

### Design Philosophy

1. **Observable-Based**: Compose with `pipe()`, `filter()`, `merge()`, and stream operators
2. **Extensible**: Add velocity tracking, axis locking, zoom transforms via operators
3. **Lightweight**: Minimal overhead for high-frequency input handling (60fps+)
4. **Immutable Signals**: Signals are readonly; operators extend values without mutation

### Typical Usage Pattern

```typescript
import { pipe, singlePointer } from "cereb";
import { session, offset } from "cereb/operators";
import { pan } from "@cereb/pan";

pipe(
  singlePointer(element),   // Normalized pointer stream
  session(),                // Group start → end as one session
  offset({ target }),       // Add element-relative coordinates
  pan(),                    // Recognize pan gesture with velocity/direction
).subscribe((signal) => {
  const { phase, deltaX, deltaY, velocityX, velocityY } = signal.value;
  // Handle pan gesture...
});
```

### Key Signal Types

- **SinglePointerSignal**: Normalized pointer data (phase, x, y, pointerType, pressure)
- **PanSignal**: Pan gesture data (deltaX/Y, velocity, distance, direction)
- **PinchSignal**: Pinch gesture data (distance, deltaDistance, centerX/Y, velocity)

## Source Code Comment Rules

### Must Do
- Write all comments in English only
- Add comments for core models (interfaces or classes) explaining their responsibility, role, and design principles
- For complex functions (not simple mapping) exceeding 30 lines, add a summary comment explaining what the function does

### Must Not Do
- Do not leave comments just for section-dividing purposes
- Do not write comments for things that can be understood from the code alone

## Commit Message Rules

Follow this format for all commits:

```
{task_type}({package}): {title_message}
```

### Guidelines
- **Title only by default**: Keep the title short and concise (under 50 characters ideal)
- **Description is rarely needed**: Only add description when essential context or rationale must be documented
- When description is necessary, keep it to 1–2 bullet points maximum
- Focus on "why" not "what"—the diff shows what changed

### Task Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test additions or modifications
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `style`: Code style changes (formatting, etc.)
- `chore`: Build, dependency, or tooling changes

### Package Names
- `core`: Core library
- `pan`: Pan gesture recognition
- `pinch`: Pinch gesture recognition
- `single-pointer`: Single pointer events
- `docs`: Documentation site (Astro app)

### Important: `docs` Package vs `docs` Task Type
- The `docs` **task type** refers to documentation changes like README updates, code comments, or API docs
- The `docs` **package** is an actual Astro application that serves the documentation site
- When adding new features or examples to the docs package, use `feat(docs)` not `docs(docs)`
- When fixing bugs in the docs package, use `fix(docs)` not `docs(docs)`
- Use `docs(*)` only for pure documentation text changes (README, comments, etc.)

### Examples

**Typical commits (title only):**
```
feat(pinch): add pinch gesture recognition
```
```
fix(core): resolve zoom operator scale calculation
```
```
docs(pan): update velocity API reference
```
```
refactor(core): simplify stream subscription logic
```

**When description is needed (rare):**
```
fix(core): change default throttle behavior

- Breaking: throttle now uses trailing edge by default
- Migration: add { leading: true } for previous behavior
```

### Commit Behavior
- **Always ask for human approval before executing any git commit**. Never commit directly without explicit user confirmation.
- Only consider files that are already staged for commit
- Do not ask about adding unstaged or untracked files
- Use `git status` to identify staged files and base commit messages only on those files
- Do not prompt to add or stage any files that the user has not already staged

## Test Code Rules

### File Structure
- Test files use the `*.spec.ts` naming convention
- Test files are placed at the same directory depth as the target `.ts` file

### Test Coverage Strategy
- Tests are based on user scenarios of the module
- Initially include only core functionality tests
- Variations that represent essential behavior of core features should be included
- Do not include all edge case variations in the initial test suite
- Edge case tests are added incrementally over time as needed
