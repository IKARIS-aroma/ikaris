// Tiny static server that mimics the real hosting target: the site's own
// generated links carry whatever prefix BASE_PATH is set to (empty for
// Cloudflare Pages' root-domain serving; previously /ikaris for GitHub
// Pages' project-repo serving), so this server strips that same prefix
// and serves from /docs. Supports HTTP Range requests (206 Partial Content) — required for the
// browser to seek within the scroll-scrubbed hero video; GitHub Pages'
// actual hosting supports this natively, but this dev server didn't, which
// silently broke local testing of video seeking (confirmed: without Range
// support, video.currentTime assignments beyond the initially-buffered
// span are just ignored by the browser).
const http = require('http');
const fs = require('fs');
const path = require('path');

const { BASE_PATH } = require('../data/site');
const ROOT = path.join(__dirname, '..', 'docs');
const PORT = process.env.PORT || 8080;

// This server used to serve every response with none of docs/_headers'
// rules applied — including the CSP. That gap meant nothing tested
// against this server ever actually exercised the CSP a real deploy
// enforces, which is exactly how a missing `connect-src blob:` (the
// GLTFLoader.js texture-loading path three.js's ImageBitmapLoader uses)
// shipped and broke every 3D model's textures in production while every
// local check here kept passing. Parsing and applying the same file this
// server would otherwise leave for Cloudflare Pages to interpret closes
// that blind spot for the next header-sensitive bug.
function parseHeadersFile(text) {
  const blocks = [];
  let current = null;
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    if (!line.startsWith(' ') && !line.startsWith('\t')) {
      current = { pattern: line.trim(), headers: {} };
      blocks.push(current);
    } else if (current) {
      const idx = line.indexOf(':');
      if (idx > -1) current.headers[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }
  return blocks;
}
function patternToRegex(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp('^' + escaped + '$');
}
let headerBlocks = [];
try {
  headerBlocks = parseHeadersFile(fs.readFileSync(path.join(ROOT, '_headers'), 'utf8'))
    .map((b) => ({ regex: patternToRegex(b.pattern), headers: b.headers }));
} catch (e) { /* no _headers yet (first run before a build) — serve without extra headers */ }
function extraHeadersFor(urlPath) {
  const merged = {};
  for (const b of headerBlocks) if (b.regex.test(urlPath)) Object.assign(merged, b.headers);
  return merged;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.glb': 'model/gltf-binary',
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath.startsWith(BASE_PATH)) urlPath = urlPath.slice(BASE_PATH.length);
  if (urlPath === '' || urlPath === '/') urlPath = '/index.html';

  let filePath = path.join(ROOT, urlPath);
  if (!path.extname(filePath)) filePath = path.join(filePath, 'index.html');

  fs.stat(filePath, (statErr, stat) => {
    if (statErr) {
      fs.readFile(path.join(ROOT, '404.html'), (err2, data2) => {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data2 || '404 Not Found');
      });
      return;
    }

    const ext = path.extname(filePath);
    const contentType = MIME[ext] || 'application/octet-stream';
    const range = req.headers.range;
    const extraHeaders = extraHeadersFor(urlPath);

    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? parseInt(match[2], 10) : stat.size - 1;
      res.writeHead(206, {
        'Content-Type': contentType,
        'Content-Length': end - start + 1,
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        ...extraHeaders,
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
      ...extraHeaders,
    });
    fs.createReadStream(filePath).pipe(res);
  });
}).listen(PORT, () => console.log(`Serving docs/ at http://localhost:${PORT}${BASE_PATH}/`));
