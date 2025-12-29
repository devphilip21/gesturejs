/**
 * Pan gesture implementation using Hammer.js.
 * This file is used to measure bundle size for comparison.
 */
import Hammer from "hammerjs";

const element = document.getElementById("target")!;

const hammer = new Hammer(element);
hammer.get("pan").set({ threshold: 10 });

hammer.on("panmove", (event) => {
  element.style.transform = `translate(${event.deltaX}px, ${event.deltaY}px)`;
});

hammer.on("panend", (event) => {
  console.log(`Final velocity: ${event.velocityX}, ${event.velocityY}`);
});
