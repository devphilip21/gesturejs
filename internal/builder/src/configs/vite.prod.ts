import { existsSync, readdirSync } from "node:fs";
import { basename, resolve } from "node:path";
import type { InlineConfig } from "vite";
import dts from "vite-plugin-dts";

function resolveEntries(cwd: string): Record<string, string> {
  const srcDir = resolve(cwd, "src");
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

  // Additional entry points (*.ts files in src root, excluding index and specs)
  if (existsSync(srcDir)) {
    const files = readdirSync(srcDir);
    for (const file of files) {
      if (
        file.endsWith(".ts") &&
        !file.endsWith(".spec.ts") &&
        !file.endsWith(".test.ts") &&
        file !== "index.ts"
      ) {
        const name = basename(file, ".ts");
        entries[name] = resolve(srcDir, file);
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
        external: [/\.spec\.ts$/, /\.test\.ts$/],
      },
    },
  };
}
