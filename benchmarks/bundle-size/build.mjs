import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import * as esbuild from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));

const entries = [
  { name: "cereb-pan", entry: "./src/cereb-pan.ts" },
  { name: "hammer-pan", entry: "./src/hammer-pan.ts" },
];

async function build() {
  mkdirSync(join(__dirname, "dist"), { recursive: true });

  const results = [];

  for (const { name, entry } of entries) {
    const outfile = join(__dirname, "dist", `${name}.js`);

    await esbuild.build({
      entryPoints: [join(__dirname, entry)],
      bundle: true,
      minify: true,
      format: "esm",
      target: "es2020",
      outfile,
      treeShaking: true,
      metafile: true,
    });

    const code = readFileSync(outfile);
    const gzipped = gzipSync(code);

    results.push({
      name,
      minified: code.length,
      gzipped: gzipped.length,
    });
  }

  // Save results for compare.mjs
  writeFileSync(join(__dirname, "dist", "results.json"), JSON.stringify(results, null, 2));

  return results;
}

const results = await build();

console.log("\n📦 Bundle Size Comparison (Pan Gesture)\n");
console.log("Library        | Minified | Gzipped");
console.log("---------------|----------|--------");

for (const { name, minified, gzipped } of results) {
  const lib = name.padEnd(14);
  const min = `${(minified / 1024).toFixed(2)} KB`.padStart(8);
  const gz = `${(gzipped / 1024).toFixed(2)} KB`.padStart(7);
  console.log(`${lib} | ${min} | ${gz}`);
}

const cereb = results.find((r) => r.name === "cereb-pan");
const hammer = results.find((r) => r.name === "hammer-pan");

if (cereb && hammer) {
  const diff = ((cereb.gzipped / hammer.gzipped) * 100).toFixed(1);
  console.log(`\nCereb is ${diff}% the size of Hammer.js (gzipped)`);
}
