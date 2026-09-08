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

    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? parseInt(match[2], 10) : stat.size - 1;
      res.writeHead(206, {
        'Content-Type': contentType,
        'Content-Length': end - start + 1,
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(filePath).pipe(res);
  });
}).listen(PORT, () => console.log(`Serving docs/ at http://localhost:${PORT}${BASE_PATH}/`));
