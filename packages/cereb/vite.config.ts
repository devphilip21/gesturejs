import { resolve } from "node:path";
import type { UserConfig } from "vite";

export default ({ dirname }: { dirname: string }): UserConfig => ({
  build: {
    lib: {
      entry: {
        index: resolve(dirname, "src/index.ts"),
        operators: resolve(dirname, "src/operators.ts"),
        "single-pointer/touch": resolve(dirname, "src/browser/single-pointer/touch.ts"),
        "single-pointer/mouse": resolve(dirname, "src/browser/single-pointer/mouse.ts"),
        "single-pointer/pointer": resolve(dirname, "src/browser/single-pointer/pointer.ts"),
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) => {
        const ext = format === "es" ? "js" : "cjs";
        return `${entryName}.${ext}`;
      },
    },
    rollupOptions: {
      external: [],
    },
  },
});
