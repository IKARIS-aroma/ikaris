const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs');

const { PRODUCTS } = require('../data/products');
const { GUIDES } = require('../data/guides');
const { SITE_URL } = require('../data/site');

const home = require('./pages/home');
const productPage = require('./pages/product');
const collectionPage = require('./pages/collection');
const aboutPage = require('./pages/about');
const guidesPages = require('./pages/guides');
const cartPage = require('./pages/cart');
const checkoutPage = require('./pages/checkout');
const orderConfirmedPage = require('./pages/order-confirmed');
const contactPage = require('./pages/contact');
const policyPages = require('./pages/policy');
const notFoundPage = require('./pages/not-found');
const analyticsDebugPage = require('./pages/analytics-debug');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writePage(relPath, html) {
  let filePath;
  if (relPath.endsWith('.html')) {
    filePath = path.join(OUT, relPath);
  } else {
    filePath = path.join(OUT, relPath, 'index.html');
  }
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, html, 'utf8');
  return relPath;
}

function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function main() {
  console.log('Cleaning output...');
  fs.rmSync(OUT, { recursive: true, force: true });
  ensureDir(OUT);

  console.log('Copying static assets...');
  copyDir(path.join(ROOT, 'assets'), path.join(OUT, 'assets'));
  ensureDir(path.join(OUT, 'css'));
  fs.copyFileSync(path.join(ROOT, 'src/css/style.css'), path.join(OUT, 'css/style.css'));
  ensureDir(path.join(OUT, 'js'));
  for (const f of ['analytics.js', 'cart.js', 'main.js', 'experience.js', 'debug.js', 'icarus-cinematic.js', 'bottle-viewer.js']) {
    fs.copyFileSync(path.join(ROOT, 'src/js', f), path.join(OUT, 'js', f));
  }
  copyDir(path.join(ROOT, 'src/js/vendor'), path.join(OUT, 'js/vendor'));

  console.log('Building pages...');
  const built = []; // { path, noindex }

  const homePage = home.build();
  writePage(homePage.path, homePage.html);
  built.push({ path: homePage.path, noindex: false });

  for (const gender of ['men', 'women']) {
    const p = collectionPage.build(gender);
    writePage(p.path, p.html);
    built.push({ path: p.path, noindex: false });
  }

  for (const product of PRODUCTS) {
    const p = productPage.build(product);
    writePage(p.path, p.html);
    built.push({ path: p.path, noindex: false });
  }

  const about = aboutPage.build();
  writePage(about.path, about.html);
  built.push({ path: about.path, noindex: false });

  const guidesIndex = guidesPages.buildIndex();
  writePage(guidesIndex.path, guidesIndex.html);
  built.push({ path: guidesIndex.path, noindex: false });

  for (const guide of GUIDES) {
    const p = guidesPages.buildGuide(guide);
    writePage(p.path, p.html);
    built.push({ path: p.path, noindex: false });
  }

  const cart = cartPage.build();
  writePage(cart.path, cart.html);
  built.push({ path: cart.path, noindex: false });

  const checkout = checkoutPage.build();
  writePage(checkout.path, checkout.html);
  built.push({ path: checkout.path, noindex: false });

  const orderConfirmed = orderConfirmedPage.build();
  writePage(orderConfirmed.path, orderConfirmed.html);
  built.push({ path: orderConfirmed.path, noindex: true });

  const contact = contactPage.build();
  writePage(contact.path, contact.html);
  built.push({ path: contact.path, noindex: false });

  const shipping = policyPages.buildShipping();
  writePage(shipping.path, shipping.html);
  built.push({ path: shipping.path, noindex: false });

  const privacy = policyPages.buildPrivacy();
  writePage(privacy.path, privacy.html);
  built.push({ path: privacy.path, noindex: false });

  const notFound = notFoundPage.build();
  writePage(notFound.path, notFound.html);
  built.push({ path: notFound.path, noindex: true });

  const debug = analyticsDebugPage.build();
  writePage(debug.path, debug.html);
  // analytics-debug is intentionally excluded from the sitemap and not counted
  // as a sitewide page — it's an unlinked internal QA tool (see build brief §6).

  console.log(`  wrote ${built.length + 1} pages`);

  console.log('Writing sitemap.xml, robots.txt, .nojekyll...');
  const indexable = built.filter((b) => !b.noindex);
  const today = new Date().toISOString().slice(0, 10);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable.map((b) => `  <url>\n    <loc>${SITE_URL}${b.path === '/' ? '/' : b.path}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`).join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemap, 'utf8');

  const robots = `User-agent: *
Allow: /
Disallow: /order-confirmed/
Disallow: /404.html
Disallow: /analytics-debug/

Sitemap: ${SITE_URL}/sitemap.xml
`;
  fs.writeFileSync(path.join(OUT, 'robots.txt'), robots, 'utf8');
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '', 'utf8');

  console.log(`Done. ${built.length + 1} pages, ${indexable.length} indexable in sitemap.`);
}

main();
