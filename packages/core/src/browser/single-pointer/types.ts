export type PointerType = "touch" | "mouse" | "pen" | "unknown";

export type PointerPhase = "start" | "move" | "end" | "cancel";

export type PointerButton = "none" | "primary" | "secondary" | "auxiliary" | "back" | "forward";

export function toPointerButton(button: number): PointerButton {
  switch (button) {
    case -1:
      return "none";
    case 0:
      return "primary";
    case 1:
      return "auxiliary";
    case 2:
      return "secondary";
    case 3:
      return "back";
    case 4:
      return "forward";
    default:
      return "none";
  }
}
