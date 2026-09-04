// One-off internal link crawler: every <a href> pointing at this site should
// resolve to a real file in /docs. Not part of the deployed site.
const fs = require('fs');
const path = require('path');
const { BASE_PATH } = require('../data/site');

const DOCS = path.join(__dirname, '..', 'docs');

function findHtmlFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findHtmlFiles(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function resolveLocalPath(urlPath) {
  let p = urlPath;
  if (p.startsWith(BASE_PATH)) p = p.slice(BASE_PATH.length);
  if (!p.startsWith('/')) p = '/' + p;
  if (p.endsWith('/')) p += 'index.html';
  return path.join(DOCS, p);
}

const files = findHtmlFiles(DOCS);
const broken = [];
let checked = 0;

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  for (const href of hrefs) {
    if (!href.startsWith(BASE_PATH + '/') && href !== BASE_PATH) continue; // skip external/mailto/anchors
    if (href.includes('#')) continue; // in-page anchors, not separate documents
    checked++;
    const localPath = resolveLocalPath(href);
    if (!fs.existsSync(localPath)) {
      broken.push({ file: path.relative(DOCS, file), href, expected: path.relative(DOCS, localPath) });
    }
  }
}

console.log(`Checked ${checked} internal links across ${files.length} files.`);
if (broken.length) {
  console.log(`${broken.length} broken link(s):`);
  broken.forEach((b) => console.log(`  - ${b.file}: href="${b.href}" -> missing ${b.expected}`));
  process.exit(1);
} else {
  console.log('All internal links resolve.');
}
