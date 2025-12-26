import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://cereb.dev",
  integrations: [
    starlight({
      title: "Cereb",
      description: "High-performance gesture recognition library for the web",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/devphilip21/cereb",
        },
      ],
      editLink: {
        baseUrl: "https://github.com/devphilip21/cereb/edit/main/docs/",
      },
      sidebar: [
        {
          label: "Getting Started",
          autogenerate: { directory: "getting-started" },
        },
        {
          label: "Core Concepts",
          items: [
            { label: "Events", slug: "core-concepts/events" },
            { label: "Signal", slug: "core-concepts/signal" },
            { label: "Gesture", slug: "core-concepts/gesture" },
            { label: "Stream", slug: "core-concepts/stream" },
          ],
        },
        {
          label: "Examples",
          autogenerate: { directory: "examples" },
        },
        {
          label: "API Reference",
          items: [
            {
              label: "Gesture",
              items: [{ label: "Pan", slug: "api/gesture/pan" }],
            },
            {
              label: "Signal",
              items: [{ label: "Single Pointer", slug: "api/signal/single-pointer" }],
            },
            {
              label: "Event",
              items: [
                { label: "Pointer Events", slug: "api/event/pointer-events" },
                { label: "Touch Events", slug: "api/event/touch-events" },
                { label: "Mouse Events", slug: "api/event/mouse-events" },
              ],
            },
            {
              label: "Stream",
              collapsed: true,
              items: [
                { label: "Overview", slug: "api/stream/overview" },
                {
                  label: "Common Operators",
                  items: [
                    { label: "map", slug: "api/stream/operators/map" },
                    { label: "filter", slug: "api/stream/operators/filter" },
                    { label: "tap", slug: "api/stream/operators/tap" },
                    { label: "throttle", slug: "api/stream/operators/throttle" },
                    { label: "debounce", slug: "api/stream/operators/debounce" },
                    { label: "take", slug: "api/stream/operators/take" },
                  ],
                },
                {
                  label: "Other Operators",
                  items: [
                    { label: "Buffering", slug: "api/stream/operators/buffering" },
                    { label: "Combination", slug: "api/stream/operators/combination" },
                    { label: "Filtering", slug: "api/stream/operators/filtering" },
                    { label: "Multicasting", slug: "api/stream/operators/multicasting" },
                  ],
                },
              ],
            },
          ],
        },
      ],
      customCss: ["./src/styles/custom.css"],
      expressiveCode: {
        themes: ["github-dark"],
      },
    }),
  ],
});
