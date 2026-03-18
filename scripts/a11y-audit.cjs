#!/usr/bin/env node
/*
  Lightweight static accessibility audit.
  This complements runtime audits and helps catch obvious regressions quickly in CI.
*/
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(process.cwd(), "src");
const exts = new Set([".tsx", ".ts"]);

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, out);
      continue;
    }
    if (exts.has(path.extname(entry.name))) {
      out.push(fullPath);
    }
  }
  return out;
}

function lineOf(content, index) {
  return content.slice(0, index).split("\n").length;
}

const files = walk(ROOT);
const violations = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");

  const imgRegex = /<img\b[^>]*>/g;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(content)) !== null) {
    const tag = imgMatch[0];
    const hasAlt = /\balt=/.test(tag);
    const genericAlt = /\balt=["'](?:|cover|thumbnail|question|image|logo)["']/i.test(tag);

    if (!hasAlt || genericAlt) {
      violations.push({
        file,
        line: lineOf(content, imgMatch.index),
        type: "img-alt",
        detail: tag,
      });
    }
  }

  const iconButtonRegex = /<(Button|button)\b[^>]*size=["']icon["'][^>]*>/g;
  let btnMatch;
  while ((btnMatch = iconButtonRegex.exec(content)) !== null) {
    const tag = btnMatch[0];
    const hasAriaLabel = /\baria-label=/.test(tag);
    if (!hasAriaLabel) {
      violations.push({
        file,
        line: lineOf(content, btnMatch.index),
        type: "button-aria",
        detail: tag,
      });
    }
  }
}

if (violations.length === 0) {
  console.log("A11Y audit passed: no obvious static violations found.");
  process.exit(0);
}

console.error(`A11Y audit found ${violations.length} potential issues:`);
for (const v of violations.slice(0, 80)) {
  const rel = path.relative(process.cwd(), v.file);
  console.error(`- ${rel}:${v.line} [${v.type}] ${v.detail}`);
}

if (violations.length > 80) {
  console.error(`...and ${violations.length - 80} more.`);
}

process.exit(1);
