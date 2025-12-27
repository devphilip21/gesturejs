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
          items: [
            { label: "Quick Start", slug: "getting-started/quick-start" },
            { label: "Core Concepts", slug: "getting-started/core-concepts" },
          ],
        },
        {
          label: "Examples",
          autogenerate: { directory: "examples" },
        },
        {
          label: "API Reference",
          items: [],
        },
      ],
      customCss: ["./src/styles/custom.css"],
      expressiveCode: {
        themes: ["github-dark"],
      },
    }),
  ],
});
