const { CONTACT, SOCIAL } = require('../../data/site');
const { renderPage } = require('../lib/layout');
const { renderBreadcrumbs } = require('../lib/breadcrumbs');
const { wrapGraph, organizationNode, brandNode, websiteNode, breadcrumbListNode, contactPointNode } = require('../lib/jsonld');

function build() {
  const path = '/contact/';

  const bodyHtml = `
  ${renderBreadcrumbs([{ name: 'Home', path: '/' }, { name: 'Contact', path }])}
  <div class="container prose">
    <div class="reveal">
      <span class="eyebrow">Contact</span>
      <h1>Get in touch</h1>
      <p>Questions about a fragrance, an order, or this project itself &mdash; reach us directly.</p>
    </div>
    <div class="reveal" style="margin-top:2rem;">
      <dl class="product-page__facts" style="grid-template-columns:1fr;border:none;gap:1rem;">
        <div><dt>Email</dt><dd><a href="mailto:${CONTACT.email}">${CONTACT.email}</a></dd></div>
        <div><dt>Instagram</dt><dd><a href="${SOCIAL.instagram}" target="_blank" rel="noopener noreferrer">@ikaris.aroma</a></dd></div>
        <div><dt>Based in</dt><dd>${CONTACT.city}</dd></div>
        <div><dt>Response time</dt><dd>This is a student project mailbox, checked periodically rather than in real time.</dd></div>
      </dl>
    </div>
    <div class="disclosure-box reveal" style="margin-top:2rem;">
      IKARIS is a student demonstration project for a digital marketing coursework assignment. This contact address does not process real orders or payments.
    </div>
  </div>
  `;

  const jsonLd = wrapGraph([
    organizationNode(), brandNode(), websiteNode(),
    breadcrumbListNode([{ name: 'Home', path: '/' }, { name: 'Contact', path }]),
    contactPointNode(),
  ]);

  const html = renderPage({
    title: 'Contact IKARIS | IKARIS',
    description: 'Get in touch with IKARIS Maison de Parfum, Kolkata. Questions about a fragrance, an order, or this student demonstration project.',
    canonicalPath: path,
    pageType: 'page',
    pageSlug: 'contact',
    bodyHtml,
    jsonLd,
  });

  return { path, html };
}

module.exports = { build };
