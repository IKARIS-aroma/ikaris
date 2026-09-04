const { PRODUCTS } = require('../../data/products');
const { renderPage } = require('../lib/layout');
const { renderBreadcrumbs } = require('../lib/breadcrumbs');
const { wrapGraph, organizationNode, brandNode, websiteNode, breadcrumbListNode, itemListNode } = require('../lib/jsonld');
const { escapeHtml } = require('../lib/html');
const { url } = require('../lib/urls');
const { hasModel, showcase } = require('../lib/showcase');

const COPY = {
  men: {
    path: '/men/',
    title: 'Men',
    heading: 'Structured, warm, built to last a full day',
    intro: 'Three compositions built on oud, leather, tobacco and cedar rather than the usual fresh-clean shortcuts. Formal enough for a boardroom, dense enough to survive one.',
  },
  women: {
    path: '/women/',
    title: 'Women',
    heading: 'Quiet on skin, unmistakable up close',
    intro: 'Three compositions across iris, rose, jasmine and musk, built for intimate sillage rather than a room-filling entrance. Read the note pyramid before you decide which one is you.',
  },
};

function build(gender) {
  const copy = COPY[gender];
  const products = PRODUCTS.filter((p) => p.gender === gender);
  const listId = `${gender}_collection`;
  const listName = `${copy.title}'s Collection`;

  const bodyHtml = `
  ${renderBreadcrumbs([{ name: 'Home', path: '/' }, { name: copy.title, path: copy.path }])}
  <div class="container">
    <div class="section-head reveal" style="text-align:left;max-width:none;margin-bottom:2rem;">
      <span class="eyebrow">${escapeHtml(copy.title)}'s Collection</span>
      <h1>${escapeHtml(copy.heading)}</h1>
      <p style="max-width:60ch">${escapeHtml(copy.intro)}</p>
    </div>

    ${showcase(products, { listId, listName, gender })}
  </div>
  `;

  const pageData = {
    type: 'collection',
    listId,
    listName,
    items: products.map((p) => ({ slug: p.slug, name: p.name, price: p.price, category: p.genderLabel, variant: '50ml' })),
  };

  const jsonLd = wrapGraph([
    organizationNode(),
    brandNode(),
    websiteNode(),
    breadcrumbListNode([{ name: 'Home', path: '/' }, { name: copy.title, path: copy.path }]),
    itemListNode(listName, products.map((p) => ({ path: `/fragrances/${p.slug}/`, name: p.name }))),
  ]);

  const title = gender === 'men' ? "Men's Eau de Parfum Collection | IKARIS" : "Women's Eau de Parfum Collection | IKARIS";
  const description = gender === 'men'
    ? "Three original men's fragrances, ₹3,800–₹4,200: oud, leather, tobacco, cedar. Real perfumery, no dupes. Browse notes, longevity and sillage."
    : "Three original women's fragrances, ₹3,500–₹3,800: iris, rose, jasmine, musk. Real perfumery, no dupes. Browse notes, longevity and sillage.";

  const anyHas3D = products.some((p) => hasModel(p.slug));
  const importMap = anyHas3D ? `<script type="importmap">{"imports":{"three":"${url('/js/vendor/three.module.min.js')}"}}</script>` : '';
  const viewerScript = anyHas3D ? `<script type="module" src="${url('/js/bottle-viewer.js')}"></script>` : '';
  const carouselScripts = `<script src="${url('/js/vendor/gsap.min.js')}"></script>
${viewerScript}
<script src="${url('/js/icarus-cinematic.js')}" defer></script>`;

  const html = renderPage({
    title,
    description,
    canonicalPath: copy.path,
    pageType: 'collection',
    pageCategory: gender,
    bodyHtml,
    pageData,
    jsonLd,
    extraHead: importMap,
    extraBodyScripts: carouselScripts,
  });

  return { path: copy.path, html };
}

module.exports = { build };
