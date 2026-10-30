import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const base = "/deutsch-gym/";
const html = readFileSync("dist/index.html", "utf8");
const manifest = JSON.parse(readFileSync("dist/manifest.webmanifest", "utf8"));
for (const key of ["id", "start_url", "scope"])
  assert.equal(manifest[key], base, key);
for (const icon of manifest.icons) {
  assert.ok(icon.src.startsWith(`${base}icons/`), icon.src);
  assert.ok(existsSync(`dist/${icon.src.slice(base.length)}`), icon.src);
}
for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  assert.ok(url.startsWith(base), `HTML resource outside project path: ${url}`);
  assert.ok(existsSync(`dist/${url.slice(base.length)}`), url);
}
const sw = readFileSync("dist/sw.js", "utf8");
assert.ok(
  sw.includes(`${base}index.html`),
  "Navigation fallback must use project base",
);
assert.ok(
  !sw.includes('createHandlerBoundToURL("/index.html")'),
  "Root fallback is invalid",
);
const { readdirSync } = await import("node:fs");
const bundles = readdirSync("dist/assets")
  .filter((name) => name.endsWith(".js"))
  .map((name) => readFileSync(`dist/assets/${name}`, "utf8"))
  .join("\n");
assert.ok(
  bundles.includes(`${base}sw.js`),
  "Service worker URL must use project base",
);
assert.ok(
  bundles.includes(`scope:"${base}"`),
  "Service worker scope must use project base",
);
console.log(
  "GitHub Pages artifact checks passed: HTML, icons, manifest, SW URL/scope/fallback.",
);
