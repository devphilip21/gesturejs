export type SinglePointerOptions = {};

export type SinglePointerType = "touch" | "mouse" | "pen" | "unknown";

export type SinglePointerPhase = "unknown" | "start" | "move" | "end" | "cancel";

export type SinglePointerButton =
  | "none"
  | "primary"
  | "secondary"
  | "auxiliary"
  | "back"
  | "forward";

export function toSinglePointerButton(button: number): SinglePointerButton {
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
