#!/usr/bin/env node
/*
 * IKARIS self-audit. Walks every built HTML file in /docs and reports SEO,
 * structure, and analytics-hygiene issues per the build brief (section 9).
 * Run after every `node generator/build.js` and fix everything it finds.
 *
 * Usage: node audit.js
 * Exit code 0 if clean, 1 if any issue found. (Node, not Python, because
 * this environment only has Node installed — see README "Toolchain".)
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DOCS = path.join(ROOT, 'docs');
const { BASE_PATH } = require('./data/site');

const TITLE_MIN = 15, TITLE_MAX = 65;
const DESC_MIN = 70, DESC_MAX = 165;
const HASHED_CLASS_RE = /^[a-zA-Z0-9_-]*_[a-f0-9]{6,}$|^css-[a-z0-9]{5,}$|^[a-zA-Z]{1,3}-[a-f0-9]{6,}$/;

function findHtmlFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findHtmlFiles(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function relUrlForFile(filepath) {
  let rel = path.relative(DOCS, filepath).replace(/\\/g, '/');
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  if (rel === 'index.html') return '/';
  return '/' + rel;
}

function extractAttrs(tagContent) {
  const attrs = {};
  const re = /([a-zA-Z0-9-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m;
  let first = true;
  while ((m = re.exec(tagContent))) {
    if (first) { first = false; continue; } // skip tag name
    const name = m[1].toLowerCase();
    const value = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4] !== undefined ? m[4] : '';
    attrs[name] = value;
  }
  return attrs;
}

function wordCount(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  const words = text.match(/[A-Za-z0-9'&’-]+/g);
  return words ? words.length : 0;
}

function auditFile(filepath, issues) {
  const rel = path.relative(DOCS, filepath).replace(/\\/g, '/');
  const html = fs.readFileSync(filepath, 'utf8');

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  if (!title) issues.push(`${rel}: missing <title>`);
  else if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
    issues.push(`${rel}: title length ${title.length} outside ${TITLE_MIN}-${TITLE_MAX} ("${title}")`);
  }

  const descMatch = html.match(/<meta\s+name="description"\s+content="([\s\S]*?)"/i);
  const desc = descMatch ? descMatch[1] : '';
  if (!desc) issues.push(`${rel}: missing meta description`);
  else if (desc.length < DESC_MIN || desc.length > DESC_MAX) {
    issues.push(`${rel}: meta description length ${desc.length} outside ${DESC_MIN}-${DESC_MAX}`);
  }

  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1Count !== 1) issues.push(`${rel}: has ${h1Count} <h1> elements (expected exactly 1)`);

  if (!/<link[^>]+rel="canonical"/i.test(html)) issues.push(`${rel}: missing <link rel="canonical">`);
  if (!/<meta[^>]+name="viewport"/i.test(html)) issues.push(`${rel}: missing viewport meta`);
  if (!/<html[^>]+lang="[^"]+"/i.test(html)) issues.push(`${rel}: missing <html lang>`);

  const imgTags = html.match(/<img\b[^>]*>/gi) || [];
  for (const tag of imgTags) {
    if (!/\balt\s*=/.test(tag)) issues.push(`${rel}: <img> missing alt attribute (${tag.slice(0, 60)}...)`);
  }

  const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  for (const [, block] of jsonLdBlocks) {
    try { JSON.parse(block); } catch (e) { issues.push(`${rel}: JSON-LD failed to parse (${e.message})`); }
  }

  if (!/<body[^>]+data-page-type="[^"]*"/i.test(html)) issues.push(`${rel}: <body> missing data-page-type`);

  const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/json)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const [, body] of inlineScripts) {
    if (/(?<!function )gtag\s*\(/.test(body) && !/consent/.test(body) && !body.includes('IKARIS_ANALYTICS')) {
      issues.push(`${rel}: hardcoded gtag( call found outside the consent/analytics bridge`);
    }
  }

  const inputTags = html.match(/<input\b[^>]*>/gi) || [];
  for (const tag of inputTags) {
    const attrs = extractAttrs(tag.replace(/^<|>$/g, ''));
    const name = (attrs.name || '').toLowerCase();
    const type = attrs.type || 'text';
    const isPii = ['name', 'email', 'address', 'city', 'state', 'pincode'].includes(name) || type === 'email';
    if (isPii && attrs['data-clarity-mask'] !== 'true') {
      issues.push(`${rel}: input "${name || type}" collects PII without data-clarity-mask="true"`);
    }
  }

  const classMatches = [...html.matchAll(/class="([^"]*)"/g)];
  const seenClasses = new Set();
  for (const [, classList] of classMatches) {
    for (const c of classList.split(/\s+/).filter(Boolean)) seenClasses.add(c);
  }
  for (const c of seenClasses) {
    if (HASHED_CLASS_RE.test(c)) issues.push(`${rel}: class "${c}" looks hashed/generated`);
  }

  return { url: relUrlForFile(filepath), words: wordCount(html) };
}

function main() {
  const issues = [];
  const warnings = [];

  if (!fs.existsSync(DOCS)) {
    console.log('docs/ not found — run `node generator/build.js` first.');
    process.exit(1);
  }

  const files = findHtmlFiles(DOCS);
  const wordCounts = {};
  const knownUrls = new Set();

  for (const f of files) {
    const { url, words } = auditFile(f, issues);
    knownUrls.add(url);
    wordCounts[url] = words;
  }

  const sitemapPath = path.join(DOCS, 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    const locs = [...sitemapContent.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => {
      let p;
      try { p = new URL(m[1]).pathname; } catch (e) { p = m[1]; }
      // sitemap URLs are absolute and carry the GitHub Pages project prefix
      // (BASE_PATH); docs/ is the site root locally, so strip it to compare.
      if (BASE_PATH && p.startsWith(BASE_PATH)) p = p.slice(BASE_PATH.length) || '/';
      return p;
    });
    for (const loc of locs) {
      if (!knownUrls.has(loc)) issues.push(`sitemap.xml: ${loc} does not correspond to a built file`);
    }
    const noindexPaths = new Set(['/order-confirmed/', '/404.html', '/analytics-debug/']);
    for (const url of knownUrls) {
      if (!locs.includes(url) && !noindexPaths.has(url)) {
        warnings.push(`${url}: built page not present in sitemap.xml (check if intentional)`);
      }
    }
  } else {
    issues.push('sitemap.xml not found');
  }

  if (!fs.existsSync(path.join(DOCS, 'robots.txt'))) issues.push('robots.txt not found');
  if (!fs.existsSync(path.join(DOCS, '.nojekyll'))) issues.push('.nojekyll not found');

  console.log(`Checked ${files.length} HTML files.\n`);

  if (warnings.length) {
    console.log(`${warnings.length} warning(s):`);
    warnings.forEach((w) => console.log('  -', w));
    console.log();
  }

  console.log('Word counts:');
  Object.keys(wordCounts).sort().forEach((url) => console.log(`  ${url}: ${wordCounts[url]} words`));
  console.log();

  if (issues.length) {
    console.log(`${issues.length} issue(s) found:`);
    issues.forEach((i) => console.log('  -', i));
    process.exit(1);
  } else {
    console.log('No issues found.');
    process.exit(0);
  }
}

main();
