#!/usr/bin/env node
/**
 * Build GitHub Release markdown from CHANGELOG.md for a version tag (e.g. v2.7.0-rc2).
 * Usage: TAG_NAME=v2.7.0-rc2 GITHUB_REPOSITORY=owner/repo node scripts/github-release-notes.mjs
 * Writes to stdout.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const tagName = process.argv[2] || process.env.TAG_NAME || "";
const repo = process.env.GITHUB_REPOSITORY || "andrew867/retro-env-can-weather-chan";

if (!tagName || !/^v[\d.a-z-]+$/i.test(tagName)) {
  console.error("Usage: TAG_NAME=v2.7.0-rc2 node scripts/github-release-notes.mjs <tag>");
  process.exit(1);
}

const version = tagName.replace(/^v/i, "");
const changelogPath = path.join(root, "CHANGELOG.md");
const raw = fs.readFileSync(changelogPath, "utf8");

const headerRe = new RegExp(
  `^##\\s*\\[${version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\][^\\n]*\\n`,
  "m"
);
const m = raw.match(headerRe);
if (!m) {
  console.error(`No CHANGELOG section found for [${version}] in CHANGELOG.md`);
  process.exit(1);
}

const start = m.index + m[0].length;
const rest = raw.slice(start);
const next = rest.search(/^##\s*\[/m);
const section = (next === -1 ? rest : rest.slice(0, next)).trim();

const blobBase = `https://github.com/${repo}/blob/${tagName}`;

/** Turn ./relative links in changelog into GitHub blob URLs for the tagged tree. */
function absolutize(md) {
  return md.replace(/\]\(\.\//g, `](${blobBase}/`);
}

const title = `Retro ECCC Weather Channel — **${tagName}**`;
const intro = [
  "> **First fork release on this repository** — cut mainly to **exercise the tag → GitHub Actions → Release** pipeline end-to-end. Treat **\`rc\`** builds as **pre-release** candidates: run your usual \`yarn gate:rc\` / \`yarn gate:rc:e2e\` before any on-air use.",
  "",
  "This channel is a **broadcast-style MSC / ECCC weather simulator** (Express API + Parcel display bundle + Playwright visual gates). Operators run it headless or behind OBS; configuration is JSON-first with a built-in config UI.",
  "",
  "---",
  "",
  "## What shipped in this tag",
  "",
  absolutize(section),
  "",
  "---",
  "",
  "## Quick links (this tree)",
  "",
  `- **Operator guide:** [OPERATORS.md](${blobBase}/OPERATORS.md) — env vars, HTTP surface, **subtree mirror** notes, safety.`,
  `- **REST cookbook:** [docs/api/REST-COOKBOOK.md](${blobBase}/docs/api/REST-COOKBOOK.md)`,
  `- **OpenAPI:** [docs/api/openapi.yaml](${blobBase}/docs/api/openapi.yaml) (spec \`info.version\` matches **${version}**; tag is **${tagName}**)`,
  `- **Full changelog:** [CHANGELOG.md](${blobBase}/CHANGELOG.md)`,
  "",
  "## Install & smoke (local)",
  "",
  "```bash",
  "yarn install",
  "yarn gate:rc          # typecheck + unit tests",
  "yarn gate:rc:e2e      # + Playwright (optional for RC validation)",
  "yarn smoke            # post-deploy HTTP checks (when server is up)",
  "```",
  "",
  "## Release automation",
  "",
  `Pushing an annotated or lightweight tag matching \`v*\` (e.g. **${tagName}**) triggers [\`.github/workflows/release-on-tag.yml\`](${blobBase}/.github/workflows/release-on-tag.yml), which composes these notes from **CHANGELOG.md** and publishes a **GitHub Release** (prerelease flag is **on** when the tag contains \`rc\`, \`beta\`, or \`alpha\`).`,
  "",
].join("\n");

process.stdout.write(`${title}\n\n${intro}\n`);
