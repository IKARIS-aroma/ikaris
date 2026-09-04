const { renderPage } = require('../lib/layout');
const { renderBreadcrumbs } = require('../lib/breadcrumbs');
const { wrapGraph, organizationNode, brandNode, websiteNode, breadcrumbListNode } = require('../lib/jsonld');
const { picture } = require('../lib/picture');
const { url } = require('../lib/urls');

function build() {
  const path = '/about/';
  const img = picture({ assetPathNoExt: 'products/iris', width: 586, height: 996, alt: 'IKARIS Iris eau de parfum bottle in soft mauve glass', loading: 'lazy' });

  const bodyHtml = `
  ${renderBreadcrumbs([{ name: 'Home', path: '/' }, { name: 'The House', path }])}
  <div class="container">
    <div class="product-page__grid">
      <div class="product-page__media reveal">
        <div class="tilt-stage" data-tilt-stage><div class="tilt-stage__inner">${img}</div><div class="tilt-stage__sheen"></div></div>
      </div>
      <div class="product-page__meta reveal" style="--rd:0.15s">
        <span class="eyebrow">The House</span>
        <h1>Built in Kolkata, priced for people who wear perfume, not who collect it</h1>
        <p>IKARIS started from a specific frustration: everything genuinely well-made cost more than most people would spend on a bottle they'd use up in a year, and everything at a reasonable price felt like it was made to be replaced. Nothing in between.</p>
        <p>So the house was built around one rule. Every composition is developed from scratch, not adapted from an existing structure, and every bottle is dressed the way a ₹8,000 fragrance would be, at a third of the price. Six fragrances, two collections, one standard: would you leave this on a shelf where guests could see it.</p>
      </div>
    </div>
  </div>

  <section class="section" style="border-top:1px solid var(--line)">
    <div class="container">
      <div class="stat-row reveal">
        <div><strong>2026</strong><span>Founded</span></div>
        <div><strong>Kolkata</strong><span>Where we're based</span></div>
        <div><strong>6</strong><span>Original compositions</span></div>
        <div><strong>0</strong><span>Adapted structures</span></div>
      </div>
    </div>
  </section>

  <section class="section" style="border-top:1px solid var(--line)">
    <div class="container prose">
      <div class="reveal">
        <h2>What "original" actually means here</h2>
        <p>Every IKARIS fragrance is built top-to-base by our perfumers as a new composition, priced against what it costs to make rather than against what a name could justify charging. We don't publish note lists that borrow the language of famous fragrances, and we don't market any bottle as an alternative to something else. If a fragrance here reminds you of another one you own, that's the note pyramid doing what note pyramids do — certain materials will always smell like themselves, in any composition. What we control is the structure, the proportion, and the finish, and that's where the actual work is.</p>
      </div>
      <div class="reveal">
        <h2>Why Kolkata</h2>
        <p>Perfumery in India has mostly meant two things: attar traditions sold as heritage, or imported names sold as aspiration. We wanted a third option, made here, without pretending to be from somewhere else. Kolkata gives us proximity to some of the country's oldest trading routes for raw materials — oud, sandalwood, spice — and a city with enough humidity and heat to test whether a fragrance actually survives a real day, not a lab-conditioned one.</p>
      </div>
      <div class="reveal">
        <h2>Why the price sits where it does</h2>
        <p>A 50ml bottle here costs what it costs to formulate a genuinely new composition, source real oud and sandalwood rather than synthetic shortcuts, and dress it properly — not what a familiar name could get away with charging. We'd rather make ten fragrances honestly than fifty diluted ones.</p>
      </div>
    </div>
  </section>
  `;

  const jsonLd = wrapGraph([
    organizationNode(),
    brandNode(),
    websiteNode(),
    breadcrumbListNode([{ name: 'Home', path: '/' }, { name: 'The House', path }]),
  ]);

  const html = renderPage({
    title: 'The House — About IKARIS Maison de Parfum | IKARIS',
    description: 'IKARIS is a Kolkata-based perfume house building original compositions, priced fairly, dressed properly. Six fragrances, zero adapted structures.',
    canonicalPath: path,
    pageType: 'page',
    pageSlug: 'about',
    bodyHtml,
    jsonLd,
  });

  return { path, html };
}

module.exports = { build };
