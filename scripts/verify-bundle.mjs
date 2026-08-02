import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { gzipSync } from "node:zlib";

const root = process.cwd();
const dist = join(root, "dist");
const limits = {
  totalJavaScriptRaw: 1_250_000,
  totalJavaScriptGzip: 350_000,
  individualJavaScriptGzip: 150_000,
  totalCssGzip: 45_000,
};

if (!existsSync(join(dist, ".vite", "manifest.json"))) {
  throw new Error(
    "Vite manifest is missing; production artifacts cannot be audited deterministically",
  );
}

const files = [];
const walk = (directory) => {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) walk(path);
    else files.push(path);
  }
};
walk(dist);

if (files.some((file) => file.endsWith(".map"))) {
  throw new Error("Production source maps must not be published in the runtime image");
}

const measured = files
  .filter((file) => [".js", ".css"].includes(extname(file)))
  .map((file) => {
    const content = readFileSync(file);
    return {
      file: relative(dist, file),
      extension: extname(file),
      raw: content.byteLength,
      gzip: gzipSync(content, { level: 9 }).byteLength,
    };
  });

const js = measured.filter((entry) => entry.extension === ".js");
const css = measured.filter((entry) => entry.extension === ".css");
const sum = (entries, field) => entries.reduce((total, entry) => total + entry[field], 0);
const totalJavaScriptRaw = sum(js, "raw");
const totalJavaScriptGzip = sum(js, "gzip");
const totalCssGzip = sum(css, "gzip");
const largestJavaScript = [...js].sort((left, right) => right.gzip - left.gzip)[0];

const assertWithin = (actual, maximum, label) => {
  if (actual > maximum) {
    throw new Error(`${label} exceeded: ${actual} bytes > ${maximum} bytes`);
  }
};
assertWithin(totalJavaScriptRaw, limits.totalJavaScriptRaw, "Total JavaScript raw size");
assertWithin(totalJavaScriptGzip, limits.totalJavaScriptGzip, "Total JavaScript gzip size");
assertWithin(totalCssGzip, limits.totalCssGzip, "Total CSS gzip size");
if (largestJavaScript) {
  assertWithin(
    largestJavaScript.gzip,
    limits.individualJavaScriptGzip,
    `JavaScript chunk ${largestJavaScript.file}`,
  );
}

console.log(
  JSON.stringify(
    {
      chunks: measured.length,
      totalJavaScriptRaw,
      totalJavaScriptGzip,
      totalCssGzip,
      largestJavaScript,
      limits,
    },
    null,
    2,
  ),
);
