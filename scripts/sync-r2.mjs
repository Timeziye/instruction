import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wranglerToml = readFileSync(path.join(root, "wrangler.toml"), "utf8");
const workerJs = readFileSync(path.join(root, "worker.js"), "utf8");

const bucketMatch = wranglerToml.match(/bucket_name\s*=\s*["']([^"']+)["']/);
const prefixMatch = workerJs.match(/const\s+key\s*=\s*["']([^"']+)\/["']\s*\+/);

if (!bucketMatch) {
  throw new Error("Could not find bucket_name in wrangler.toml");
}

if (!prefixMatch) {
  throw new Error("Could not find the R2 key prefix in worker.js");
}

const bucket = bucketMatch[1];
const prefix = prefixMatch[1];
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

const skippedDirs = new Set([".git", ".github", ".wrangler", "node_modules"]);
const skippedFiles = new Set([
  "worker.js",
  "wrangler.toml",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  ".env",
  ".dev.vars",
]);

function shouldSkip(relativePath) {
  const parts = relativePath.split(path.sep);
  if (parts.some((part) => skippedDirs.has(part))) return true;
  if (relativePath === path.join("scripts", "sync-r2.mjs")) return true;
  const base = path.basename(relativePath);
  if (skippedFiles.has(base)) return true;
  if (base.startsWith(".") && base !== ".well-known") return true;
  return false;
}

function collectFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const absolutePath = path.join(dir, entry);
    const relativePath = path.relative(root, absolutePath);
    if (shouldSkip(relativePath)) continue;

    const stat = statSync(absolutePath);
    if (stat.isDirectory()) {
      files.push(...collectFiles(absolutePath));
    } else if (stat.isFile()) {
      files.push(absolutePath);
    }
  }
  return files;
}

const files = collectFiles(root);
console.log(`Syncing ${files.length} files to r2://${bucket}/${prefix}/`);

for (const file of files) {
  const relativePath = path.relative(root, file).split(path.sep).join("/");
  const objectKey = `${prefix}/${relativePath}`;
  console.log(`Uploading ${relativePath} -> ${objectKey}`);

  const result = spawnSync(
    npx,
    ["--yes", "wrangler", "r2", "object", "put", `${bucket}/${objectKey}`, "--file", file],
    { cwd: root, stdio: "inherit" },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Failed to upload ${relativePath}`);
  }
}

console.log("R2 sync completed.");
