import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const fail = (message) => {
  throw new Error(message);
};
const requireText = (path, text) => {
  if (!read(path).includes(text)) fail(`${path} is missing: ${text}`);
};

const packageJson = JSON.parse(read("package.json"));
if (packageJson.version !== "2.0.0") fail("Release version must be 2.0.0");
if (packageJson.dependencies.react !== "19.2.7") fail("React must remain pinned to 19.2.7");
if (packageJson.devDependencies.typescript !== "7.0.2")
  fail("TypeScript must remain pinned to 7.0.2");
if (packageJson.devDependencies["@axe-core/playwright"] !== "4.12.1")
  fail("Accessibility e2e dependency must remain pinned");

for (const route of [
  "/v1/events",
  "/v1/daily-metrics/",
  "/v1/reconciliations",
  "/v1/replays",
  "/checkpoints",
  "/retry",
])
  requireText("src/api/reconciliation-api.ts", route);

for (const header of [
  "Content-Security-Policy",
  "X-Content-Type-Options",
  "X-Frame-Options",
  "X-Permitted-Cross-Domain-Policies",
  "Permissions-Policy",
  "Cross-Origin-Opener-Policy",
  "Origin-Agent-Cluster",
  "Strict-Transport-Security",
])
  requireText("nginx/snippets/security-headers.conf", header);

requireText("Dockerfile", "FROM node:24.18.0-alpine AS build");
requireText("Dockerfile", "FROM nginx:1.30.4-alpine AS runtime");
requireText("Dockerfile", "USER nginx");
requireText("docker-compose.yml", "read_only: true");
requireText("docker-compose.yml", "no-new-privileges:true");
requireText("src/api/http-client.ts", "target.origin !== window.location.origin");
requireText("src/api/http-client.ts", "MAX_SUCCESS_BODY_LENGTH");
requireText("src/auth/AuthProvider.tsx", "sessionStorage");
requireText("nginx/default.conf.template", "map $http_sec_fetch_site $cross_site_request");
requireText("nginx/default.conf.template", "map $request_method $api_method_allowed");
requireText("nginx/default.conf.template", "map $http_x_correlation_id $upstream_correlation_id");
requireText("nginx/default.conf.template", 'map "$request_method:$http_content_type"');
requireText("nginx/default.conf.template", 'proxy_set_header Authorization ""');
requireText("nginx/default.conf.template", 'proxy_set_header Cookie ""');
requireText("nginx/default.conf.template", "proxy_hide_header Set-Cookie");
requireText("nginx/default.conf.template", "location = /actuator/health");
requireText("nginx/default.conf.template", "include /etc/nginx/snippets/security-headers.conf");
requireText("Dockerfile", "COPY nginx/snippets/security-headers.conf");
requireText("vite.config.ts", "manifest: true");
requireText("package.json", "scripts/verify-bundle.mjs");
requireText("e2e/accessibility.spec.ts", "@axe-core/playwright");
requireText(".github/workflows/codeql.yml", "github/codeql-action/init@v4");

const sourceFiles = [];
const walk = (directory) => {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(ts|tsx|js|mjs)$/.test(path)) sourceFiles.push(path);
  }
};
walk(join(root, "src"));

for (const path of sourceFiles) {
  const content = readFileSync(path, "utf8");
  const name = relative(root, path);
  if (content.includes("dangerouslySetInnerHTML")) fail(`${name} enables arbitrary HTML rendering`);
  if (/\beval\s*\(/.test(content)) fail(`${name} uses eval`);
  if (!name.includes(".test.") && /localStorage\.(setItem|getItem)\([^\n]*apiKey/i.test(content))
    fail(`${name} persists an API key`);
  if (/TODO|FIXME/.test(content)) fail(`${name} contains unfinished work markers`);
}

if (read("public/config.js").includes("BACKEND_API_KEY"))
  fail("Runtime browser config exposes backend secret naming");
console.log(`Static verification passed for ${sourceFiles.length} source files.`);
