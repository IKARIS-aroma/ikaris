const { renderPage } = require('../lib/layout');
const { renderBreadcrumbs } = require('../lib/breadcrumbs');
const { wrapGraph, organizationNode, brandNode, websiteNode, breadcrumbListNode } = require('../lib/jsonld');
const { url } = require('../lib/urls');

function build() {
  const path = '/order-confirmed/';

  const bodyHtml = `
  ${renderBreadcrumbs([{ name: 'Home', path: '/' }, { name: 'Order Confirmed', path }])}
  <div class="container">
    <div class="confirm-panel">
      <span class="eyebrow">Order Confirmed</span>
      <h1>Thank you</h1>
      <p>Reference number</p>
      <p class="confirm-ref" data-order-ref data-testid="order-ref">&mdash;</p>
      <div data-order-summary style="text-align:left;max-width:420px;margin:2rem auto;"></div>

      <div class="disclosure-box" data-testid="confirmation-disclosure">
        <strong>This is a student demonstration project.</strong> No real order has been placed, no payment has been taken, and nothing will be shipped. This page exists to demonstrate a completed e-commerce funnel for a digital marketing coursework assignment.
      </div>

      <a href="${url('/men/')}" class="btn btn-primary btn-magnetic">Continue Browsing</a>
    </div>
  </div>
  `;

  const jsonLd = wrapGraph([
    organizationNode(), brandNode(), websiteNode(),
    breadcrumbListNode([{ name: 'Home', path: '/' }, { name: 'Order Confirmed', path }]),
  ]);

  const html = renderPage({
    title: 'Order Confirmed (Simulated) | IKARIS',
    description: 'Simulated order confirmation for a student analytics project. No real order was placed and no payment was taken.',
    canonicalPath: path,
    noindex: true,
    pageType: 'confirmation',
    pageSlug: 'order-confirmed',
    bodyHtml,
    jsonLd,
  });

  return { path, html };
}

module.exports = { build };
