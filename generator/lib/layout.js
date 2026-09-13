const { BRAND, ANALYTICS, SEARCH_CONSOLE_VERIFICATION, BING_VERIFICATION, NAV, FOOTER_LINKS, SOCIAL, SITE_URL } = require('../../data/site');
const { escapeHtml, escapeAttr } = require('./html');
const { url, absoluteUrl, assetUrl } = require('./urls');

const ICON_CART =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';
const ICON_MENU =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
const ICON_CLOSE =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

function renderConsentDefaultScript() {
  return `<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
  wait_for_update: 500
});
</script>`;
}

function renderGtmHeadSnippet() {
  return `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${ANALYTICS.GTM_CONTAINER_ID}');</script>`;
}

function renderGtmNoscript() {
  return `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${ANALYTICS.GTM_CONTAINER_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;
}

function renderAnalyticsConfigScript() {
  return `<script>window.IKARIS_ANALYTICS = ${JSON.stringify(ANALYTICS)};</script>`;
}

function renderHead(opts) {
  const {
    title,
    description,
    canonicalPath,
    ogType = 'website',
    ogImagePath = '/assets/og-default.jpg',
    ogImageAlt = `${BRAND.name} — ${BRAND.descriptor}`,
    ogImageWidth = 1200,
    ogImageHeight = 630,
    noindex = false,
    jsonLd = null,
    extraHead = '',
  } = opts;

  const canonicalAbs = absoluteUrl(canonicalPath);
  const ogImageAbs = absoluteUrl(ogImagePath);

  return `<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeAttr(description)}">
<link rel="canonical" href="${canonicalAbs}">
<meta name="robots" content="${noindex ? 'noindex,follow' : 'index,follow'}">
<meta name="google-site-verification" content="${SEARCH_CONSOLE_VERIFICATION}">
<meta name="msvalidate.01" content="${BING_VERIFICATION}">

<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${BRAND.name}">
<meta property="og:title" content="${escapeAttr(title)}">
<meta property="og:description" content="${escapeAttr(description)}">
<meta property="og:url" content="${canonicalAbs}">
<meta property="og:image" content="${ogImageAbs}">
<meta property="og:image:width" content="${ogImageWidth}">
<meta property="og:image:height" content="${ogImageHeight}">
<meta property="og:image:alt" content="${escapeAttr(ogImageAlt)}">
<meta property="og:locale" content="en_IN">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeAttr(title)}">
<meta name="twitter:description" content="${escapeAttr(description)}">
<meta name="twitter:image" content="${ogImageAbs}">

<link rel="icon" href="${assetUrl('favicon-32.png')}" sizes="32x32" type="image/png">
<link rel="icon" href="${assetUrl('favicon-16.png')}" sizes="16x16" type="image/png">
<link rel="icon" href="${assetUrl('favicon-192.png')}" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="${assetUrl('apple-touch-icon.png')}">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..500;0,6..96,600;1,6..96,500&family=Jost:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${url('/css/style.css')}">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
${renderConsentDefaultScript()}
${renderGtmHeadSnippet()}
${renderAnalyticsConfigScript()}
<script src="${url('/js/analytics.js')}" defer></script>
${extraHead}
</head>`;
}

function renderHeader(canonicalPath = '') {
  // "Guides" should stay marked current across every individual guide
  // article, not just the /guides/ index itself — a prefix match for that
  // one section, exact match everywhere else (Men/Women intentionally
  // don't extend to product pages here: a product belongs to a specific
  // fragrance, not really "the Men page" or "the Women page").
  const isActive = (href) => (href === '/guides/' ? canonicalPath.startsWith(href) : canonicalPath === href);
  const navItems = NAV.map((n) => `<li><a href="${url(n.href)}"${isActive(n.href) ? ' class="is-current" aria-current="page"' : ''}>${escapeHtml(n.label)}<span class="main-nav__underline" aria-hidden="true"></span></a></li>`).join('');
  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="container site-header__bar">
    <a href="${url('/')}" class="brand-mark" data-testid="brand-logo">
      <img src="${assetUrl('logo-mark.png')}" width="34" height="32" alt="${escapeAttr(BRAND.name)} emblem">
      <span class="brand-mark__word">${escapeHtml(BRAND.name)}</span>
    </a>
    <nav class="main-nav" aria-label="Primary"><ul>${navItems}</ul></nav>
    <div class="header-actions">
      <a href="${url('/cart/')}" class="icon-btn" aria-label="Cart" data-testid="cart-link">
        ${ICON_CART}<span class="cart-badge" hidden data-testid="cart-count">0</span>
      </a>
      <button type="button" class="icon-btn nav-toggle" data-nav-toggle aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu" data-testid="nav-toggle">${ICON_MENU}</button>
    </div>
  </div>
</header>
<div class="mobile-nav" data-mobile-nav id="mobile-nav" role="dialog" aria-modal="true" aria-label="Menu">
  <div class="mobile-nav__top">
    <button type="button" class="icon-btn" data-nav-close aria-label="Close menu">${ICON_CLOSE}</button>
  </div>
  <ul>
    ${NAV.map((n) => `<li><a href="${url(n.href)}">${escapeHtml(n.label)}</a></li>`).join('')}
    <li><a href="${url('/cart/')}">Cart</a></li>
  </ul>
</div>`;
}

function renderFooter() {
  const shopLinks = NAV.map((n) => `<li><a href="${url(n.href)}">${escapeHtml(n.label)}</a></li>`).join('');
  const supportLinks = FOOTER_LINKS.map((n) => `<li><a href="${url(n.href)}">${escapeHtml(n.label)}</a></li>`).join('');
  return `<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <img src="${assetUrl('logo-mark.png')}" width="40" height="38" alt="${escapeAttr(BRAND.name)} emblem">
        <p>${escapeHtml(BRAND.tagline)}</p>
      </div>
      <div><h4>Shop</h4><ul>${shopLinks}</ul></div>
      <div><h4>Support</h4><ul>${supportLinks}</ul></div>
      <div><h4>Follow</h4><ul><li><a href="${escapeAttr(SOCIAL.instagram)}" target="_blank" rel="noopener noreferrer">Instagram</a></li></ul></div>
    </div>
    <div class="footer-bottom">
      <span>&copy; ${BRAND.established}&ndash;present ${escapeHtml(BRAND.name)}. ${escapeHtml(BRAND.origin)}. ${escapeHtml(BRAND.shipping)}.</span>
      <span>${escapeHtml(BRAND.name)} ${escapeHtml(BRAND.descriptor)}</span>
    </div>
    <p class="footer-disclosure" data-testid="student-disclosure">This is a student demonstration project built for a digital marketing coursework assignment. No real orders are processed, no payments are taken, and no products are shipped. The checkout flow is simulated for analytics testing only.</p>
  </div>
</footer>`;
}

function renderConsentBanner() {
  return `<div class="consent-banner" data-consent-banner role="dialog" aria-live="polite" aria-label="Cookie consent" data-testid="consent-banner">
  <div class="consent-banner__inner">
    <p>We use cookies to understand how visitors use this site. This is a student project &mdash; no data is sold, and nothing submitted here is used for a real transaction. <a href="${url('/privacy/')}">Privacy policy</a>.</p>
    <div class="consent-banner__actions">
      <button type="button" class="btn btn-ghost" data-consent-reject data-testid="consent-reject">Reject</button>
      <button type="button" class="btn btn-primary" data-consent-accept data-testid="consent-accept">Accept</button>
    </div>
  </div>
</div>`;
}

function renderPage(opts) {
  const {
    title,
    description,
    canonicalPath,
    ogType,
    ogImagePath,
    ogImageAlt,
    ogImageWidth,
    ogImageHeight,
    noindex = false,
    jsonLd = null,
    pageType,
    pageCategory = '',
    pageSlug = '',
    bodyHtml,
    pageData = null,
    extraHead = '',
    extraBodyScripts = '',
  } = opts;

  const head = renderHead({ title, description, canonicalPath, ogType, ogImagePath, ogImageAlt, ogImageWidth, ogImageHeight, noindex, jsonLd, extraHead });
  const pageDataScript = pageData ? `<script type="application/json" id="ikaris-data">${JSON.stringify(pageData)}</script>` : '';

  return `<!doctype html>
<html lang="en-IN">
${head}
<body data-page-type="${escapeAttr(pageType)}" data-page-category="${escapeAttr(pageCategory)}" data-page-slug="${escapeAttr(pageSlug)}" data-base-path="${escapeAttr(require('../../data/site').BASE_PATH)}">
${renderGtmNoscript()}
<div class="preloader" aria-hidden="true"><img src="${assetUrl('logo-mark.png')}" alt=""></div>
<noscript><style>.preloader{display:none!important}</style></noscript>
<div class="grain" aria-hidden="true"></div>
${renderHeader(canonicalPath)}
<main id="main">
${bodyHtml}
</main>
${renderFooter()}
${renderConsentBanner()}
${pageDataScript}
<script src="${url('/js/cart.js')}" defer></script>
<script src="${url('/js/main.js')}" defer></script>
<script src="${url('/js/experience.js')}" defer></script>
${extraBodyScripts}
</body>
</html>`;
}

module.exports = { renderPage, renderHead, renderHeader, renderFooter, renderConsentBanner };
