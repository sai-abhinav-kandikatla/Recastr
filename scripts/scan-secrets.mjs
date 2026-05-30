import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const ignoredDirs = new Set([".git", ".next", ".next-dev", "node_modules", "artifacts"]);
const ignoredFiles = new Set(["package-lock.json", "tsconfig.tsbuildinfo", "scan-secrets.mjs"]);
const allowedEnvFiles = new Set([".env.example"]);

const patterns = [
  ["OpenAI API key", /sk-(?:proj-)?[A-Za-z0-9_-]{32,}/],
  ["Supabase secret key", /sb_secret_[A-Za-z0-9_-]{16,}/],
  ["Razorpay secret", /rzp_(?:test|live)_[A-Za-z0-9]{10,}.*secret/i],
  ["Postgres URL with password", /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@/i],
  ["Private key", /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/],
];

const findings = [];

await scan(root);

if (findings.length) {
  for (const finding of findings) {
    console.error(`${finding.label}: ${path.relative(root, finding.file)}`);
  }
  process.exit(1);
}

console.log("Secret scan passed");

async function scan(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) await scan(fullPath);
      continue;
    }

    if (ignoredFiles.has(entry.name)) continue;
    if (entry.name.startsWith(".env") && !allowedEnvFiles.has(entry.name)) continue;

    const text = await readFile(fullPath, "utf8").catch(() => "");
    for (const [label, pattern] of patterns) {
      const matches = text.match(pattern) ?? [];
      for (const match of matches) {
        if (isAllowedExample(label, match, entry.name)) continue;
        findings.push({ label, file: fullPath });
      }
    }
  }
}

function isAllowedExample(label, value, fileName) {
  return (
    fileName === ".env.example" &&
    label === "Postgres URL with password" &&
    value.includes("postgresql://postgres:postgres@")
  );
}
