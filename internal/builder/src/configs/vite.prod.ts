import { existsSync, readdirSync } from "node:fs";
import { basename, resolve } from "node:path";
import type { InlineConfig } from "vite";
import dts from "vite-plugin-dts";

function resolveEntries(cwd: string): Record<string, string> {
  const srcDir = resolve(cwd, "src");
  const exportsDir = resolve(srcDir, "exports");
  const entries: Record<string, string> = {};

  // Main entry
  const tsEntry = resolve(srcDir, "index.ts");
  if (existsSync(tsEntry)) {
    entries["index"] = tsEntry;
  } else {
    const jsEntry = resolve(srcDir, "index.js");
    if (existsSync(jsEntry)) {
      entries["index"] = jsEntry;
    }
  }

  // Entry points from src/exports/ directory
  if (existsSync(exportsDir)) {
    const files = readdirSync(exportsDir);
    for (const file of files) {
      if (file.endsWith(".ts") && !file.endsWith(".spec.ts") && !file.endsWith(".test.ts")) {
        const name = basename(file, ".ts");
        entries[name] = resolve(exportsDir, file);
      }
    }
  }

  return entries;
}

export function createViteProdConfig(): InlineConfig {
  const cwd = process.cwd();
  const entries = resolveEntries(cwd);

  return {
    plugins: [
      dts({
        insertTypesEntry: true,
        exclude: ["**/*.spec.ts", "**/*.test.ts"],
      }),
    ],
    build: {
      lib: {
        entry: entries,
        formats: ["es", "cjs"],
        fileName: (format, entryName) => {
          const ext = format === "es" ? "js" : "cjs";
          return `${entryName}.${ext}`;
        },
      },
      outDir: resolve(cwd, "dist"),
      sourcemap: true,
      minify: "esbuild",
      rollupOptions: {
        external: (id) => {
          // Always exclude test files
          if (/\.spec\.ts$|\.test\.ts$/.test(id)) return true;
          // Bundle @cereb/* packages (workspace dependencies) into the output
          if (id.startsWith("@cereb/")) return false;
          return undefined; // Let Vite decide for other dependencies
        },
      },
    },
  };
}
