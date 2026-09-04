const { CONTACT } = require('../../data/site');
const { renderPage } = require('../lib/layout');
const { renderBreadcrumbs } = require('../lib/breadcrumbs');
const { wrapGraph, organizationNode, brandNode, websiteNode, breadcrumbListNode } = require('../lib/jsonld');

function buildShipping() {
  const path = '/shipping-and-returns/';
  const bodyHtml = `
  ${renderBreadcrumbs([{ name: 'Home', path: '/' }, { name: 'Shipping & Returns', path }])}
  <div class="container prose">
    <div class="reveal">
      <span class="eyebrow">Policy</span>
      <h1>Shipping &amp; Returns</h1>
    </div>
    <div class="disclosure-box reveal">
      IKARIS is a student demonstration project. No products are physically shipped and no returns are processed &mdash; the policy below describes what a real version of this policy would say, for the purposes of this coursework assignment.
    </div>
    <div class="reveal">
      <h2>Shipping</h2>
      <p>IKARIS ships India-wide from Kolkata. Standard delivery runs 3&ndash;6 business days depending on destination; metro cities typically see the shorter end of that window. Every order ships in tamper-sealed outer packaging, in addition to the retail box.</p>
      <h2>Order tracking</h2>
      <p>A tracking link would be sent to the email address provided at checkout once an order dispatches. On this demonstration site, no dispatch or tracking email is ever sent, since no real order exists.</p>
      <h2>Returns</h2>
      <p>Due to the nature of fragrance as a hygiene product, opened bottles are not eligible for return. Unopened bottles in original packaging can be returned within 7 days of delivery for a full refund, minus return shipping.</p>
      <h2>Damaged or incorrect items</h2>
      <p>Any item arriving damaged or incorrect would be replaced at no cost, provided it's reported within 48 hours of delivery with photos of the damage.</p>
    </div>
  </div>
  `;

  const jsonLd = wrapGraph([
    organizationNode(), brandNode(), websiteNode(),
    breadcrumbListNode([{ name: 'Home', path: '/' }, { name: 'Shipping & Returns', path }]),
  ]);

  const html = renderPage({
    title: 'Shipping & Returns Policy | IKARIS',
    description: 'IKARIS shipping and returns policy: India-wide delivery in 3–6 days, 7-day returns on unopened bottles, and how damaged items are handled.',
    canonicalPath: path,
    pageType: 'page',
    pageSlug: 'shipping-and-returns',
    bodyHtml,
    jsonLd,
  });

  return { path, html };
}

function buildPrivacy() {
  const path = '/privacy/';
  const bodyHtml = `
  ${renderBreadcrumbs([{ name: 'Home', path: '/' }, { name: 'Privacy', path }])}
  <div class="container prose">
    <div class="reveal">
      <span class="eyebrow">Policy</span>
      <h1>Privacy Policy</h1>
    </div>
    <div class="disclosure-box reveal">
      IKARIS is a student demonstration project built for a digital marketing coursework assignment. This site processes no real orders and takes no real payments. Any name, email, or address entered at checkout is used only to render a simulated confirmation screen in your own browser &mdash; it is never transmitted to a server, stored remotely, or used for any purpose beyond that page.
    </div>
    <div class="reveal">
      <h2>What this site collects</h2>
      <p>This site uses browser storage (localStorage and sessionStorage) to remember your cart, your cookie consent choice, and an anonymous visitor identifier. With your consent, it also sends anonymised analytics events &mdash; page views, product views, cart actions &mdash; to Google Analytics 4 and, if enabled, Microsoft Clarity. No name, email, or postal address is ever included in an analytics event.</p>
      <h2>Cookie consent</h2>
      <p>Analytics cookies and scripts only load after you accept the cookie banner. You can withdraw consent at any time by clearing your browser's site data for this domain. Google Consent Mode is used to keep ad and analytics storage denied by default until you choose otherwise.</p>
      <h2>Your rights under India's DPDP Act, 2023</h2>
      <p>India's Digital Personal Data Protection Act gives you the right to know what personal data is processed about you, to correct it, and to have it erased. Since this demonstration site stores checkout information only in your own browser and never on a server we control, you can exercise all of these rights yourself by clearing your browser storage for this site at any time.</p>
      <h2>Third-party tools</h2>
      <p>When enabled, this site may use Google Analytics 4, Google Tag Manager, Microsoft Clarity, and Meta Pixel. Each operates under its own privacy policy. No IDs configured on this demonstration deployment are connected to a real, active account.</p>
      <h2>Contact</h2>
      <p>Questions about this policy can be sent to <a href="mailto:${CONTACT.email}">${CONTACT.email}</a>.</p>
    </div>
  </div>
  `;

  const jsonLd = wrapGraph([
    organizationNode(), brandNode(), websiteNode(),
    breadcrumbListNode([{ name: 'Home', path: '/' }, { name: 'Privacy', path }]),
  ]);

  const html = renderPage({
    title: 'Privacy Policy | IKARIS',
    description: 'How IKARIS handles data: browser-only cart storage, consent-gated analytics, DPDP Act rights, and why this student project takes no real payments.',
    canonicalPath: path,
    pageType: 'page',
    pageSlug: 'privacy',
    bodyHtml,
    jsonLd,
  });

  return { path, html };
}

module.exports = { buildShipping, buildPrivacy };
