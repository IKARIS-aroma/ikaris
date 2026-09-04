const { GUIDES } = require('../../data/guides');
const { renderPage } = require('../lib/layout');
const { renderBreadcrumbs } = require('../lib/breadcrumbs');
const { wrapGraph, organizationNode, brandNode, websiteNode, breadcrumbListNode, articleNode, faqPageNode } = require('../lib/jsonld');
const { escapeHtml } = require('../lib/html');

function renderBlock(b) {
  if (b.type === 'h2') return `<h2>${escapeHtml(b.text)}</h2>`;
  if (b.type === 'h3') return `<h3>${escapeHtml(b.text)}</h3>`;
  if (b.type === 'ul') return `<ul>${b.items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
  if (b.type === 'ol') return `<ol>${b.items.map((i) => `<li>${i}</li>`).join('')}</ol>`;
  if (b.type === 'p') return `<p>${b.html || escapeHtml(b.text)}</p>`;
  return '';
}

function buildIndex() {
  const path = '/guides/';
  const cards = GUIDES.map((g) => `<article class="guide-card reveal">
    <h2 style="font-size:1.3rem;"><a href="/guides/${g.slug}/">${escapeHtml(g.title)}</a></h2>
    <p>${escapeHtml(g.metaDescription)}</p>
    <a href="/guides/${g.slug}/" class="btn btn-ghost" style="margin-top:1rem;">Read the guide</a>
  </article>`).join('');

  const bodyHtml = `
  ${renderBreadcrumbs([{ name: 'Home', path: '/' }, { name: 'Guides', path }])}
  <div class="container">
    <div class="section-head reveal" style="text-align:left;max-width:none;margin-bottom:2rem;">
      <span class="eyebrow">Guides</span>
      <h1>Read before you choose a fragrance</h1>
      <p style="max-width:65ch">Four short, practical guides on how fragrance actually works — notes, concentration, longevity, and how to choose without guessing.</p>
    </div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">${cards}</div>
  </div>
  `;

  const jsonLd = wrapGraph([
    organizationNode(), brandNode(), websiteNode(),
    breadcrumbListNode([{ name: 'Home', path: '/' }, { name: 'Guides', path }]),
  ]);

  const html = renderPage({
    title: 'Fragrance Guides — Notes, EDP vs EDT, Longevity | IKARIS',
    description: 'Four practical guides to fragrance: how to choose a perfume, EDP vs EDT explained, making perfume last longer, and how notes actually work.',
    canonicalPath: path,
    pageType: 'page',
    pageSlug: 'guides',
    bodyHtml,
    jsonLd,
  });

  return { path, html };
}

function buildGuide(guide) {
  const path = `/guides/${guide.slug}/`;
  const bodyBlocks = guide.blocks.map(renderBlock).join('\n');
  const faqHtml = guide.faq && guide.faq.length
    ? `<div class="reveal" style="margin-top:3rem;">
        <h2>Frequently asked questions</h2>
        ${guide.faq.map((f) => `<div class="faq-item"><h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p></div>`).join('')}
      </div>`
    : '';

  const bodyHtml = `
  ${renderBreadcrumbs([{ name: 'Home', path: '/' }, { name: 'Guides', path: '/guides/' }, { name: guide.title, path }])}
  <div class="container">
    <article class="guide-article">
      <div class="reveal">
        <span class="eyebrow">Guide</span>
        <h1>${escapeHtml(guide.title)}</h1>
        <p class="guide-meta">Published ${guide.datePublished}</p>
      </div>
      <div class="reveal">${bodyBlocks}</div>
      ${faqHtml}
      <div data-guide-end aria-hidden="true" style="height:1px;"></div>
    </article>
  </div>
  `;

  const jsonLd = wrapGraph([
    organizationNode(), brandNode(), websiteNode(),
    breadcrumbListNode([{ name: 'Home', path: '/' }, { name: 'Guides', path: '/guides/' }, { name: guide.title, path }]),
    articleNode(guide, path, '/assets/og-default.jpg'),
    guide.faq && guide.faq.length ? faqPageNode(guide.faq) : null,
  ]);

  const html = renderPage({
    title: guide.metaTitle,
    description: guide.metaDescription,
    canonicalPath: path,
    ogType: 'article',
    pageType: 'guide',
    pageSlug: guide.slug,
    bodyHtml,
    jsonLd,
  });

  return { path, html };
}

module.exports = { buildIndex, buildGuide };
