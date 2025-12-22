import { resolve } from "node:path";
import type { UserConfig } from "vite";

export default ({ dirname }: { dirname: string }): UserConfig => ({
  build: {
    lib: {
      entry: {
        index: resolve(dirname, "src/index.ts"),
        "extensions/index": resolve(dirname, "src/extensions/index.ts"),
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) => {
        const ext = format === "es" ? "js" : "cjs";
        return `${entryName}.${ext}`;
      },
    },
    rollupOptions: {
      external: [
        "@gesturejs/gesture",
        "@gesturejs/signal",
        "@gesturejs/stream",
        "@gesturejs/single-pointer",
      ],
    },
  },
});
