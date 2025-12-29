/**
 * Pan gesture implementation using Cereb.
 * This file is used to measure bundle size after tree-shaking.
 */
import { pan } from "@cereb/pan";

const element = document.getElementById("target")!;

pan(element, { threshold: 10 }).on((signal) => {
  const { phase, deltaX, deltaY, velocityX, velocityY } = signal.value;

  if (phase === "move") {
    element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  }

  if (phase === "end") {
    console.log(`Final velocity: ${velocityX}, ${velocityY}`);
  }
});
