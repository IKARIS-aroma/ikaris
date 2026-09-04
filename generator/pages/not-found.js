const { renderPage } = require('../lib/layout');
const { wrapGraph, organizationNode, brandNode, websiteNode } = require('../lib/jsonld');
const { url } = require('../lib/urls');

function build() {
  const path = '/404.html';

  const bodyHtml = `
  <div class="container">
    <div class="error-page reveal">
      <span class="eyebrow">404</span>
      <h1>This page has drifted off</h1>
      <p style="color:var(--muted);max-width:50ch;margin:0 auto 2rem;">The page you're looking for doesn't exist, or has moved. Here's where to pick the scent back up.</p>
      <div class="hero__actions" style="justify-content:center;">
        <a href="${url('/')}" class="btn btn-primary btn-magnetic">Back to Home</a>
        <a href="${url('/men/')}" class="btn btn-ghost btn-magnetic">Shop Men</a>
        <a href="${url('/women/')}" class="btn btn-ghost btn-magnetic">Shop Women</a>
      </div>
    </div>
  </div>
  `;

  const jsonLd = wrapGraph([organizationNode(), brandNode(), websiteNode()]);

  const html = renderPage({
    title: 'Page Not Found | IKARIS',
    description: 'This page could not be found. Browse IKARIS men’s and women’s eau de parfum collections instead.',
    canonicalPath: '/404.html',
    noindex: true,
    pageType: 'page',
    pageSlug: '404',
    bodyHtml,
    jsonLd,
  });

  return { path, html };
}

module.exports = { build };
