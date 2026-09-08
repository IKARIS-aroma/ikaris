const { PRODUCTS } = require('../../data/products');
const { renderPage } = require('../lib/layout');
const { wrapGraph, organizationNode, brandNode, websiteNode } = require('../lib/jsonld');
const { picture } = require('../lib/picture');
const { url, assetUrl } = require('../lib/urls');
const { renderIcarusFigure } = require('../lib/icarus-figure');
const { hasModel, showcase } = require('../lib/showcase');

function particles(n) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const left = ((i * 37) % 100);
    const top = ((i * 53) % 70);
    const scale = 0.6 + ((i * 17) % 10) / 10;
    out += `<span style="left:${left}%;top:${top}%;transform:scale(${scale.toFixed(2)})"></span>`;
  }
  return out;
}

function build() {
  const men = PRODUCTS.filter((p) => p.gender === 'men');
  const women = PRODUCTS.filter((p) => p.gender === 'women');

  const heroHas3D = hasModel('vesper');
  const bottleImg = picture({ assetPathNoExt: 'products/vesper', width: 586, height: 996, alt: '', loading: 'eager', fetchpriority: 'high' });

  const epic = `
  <section class="epic" data-epic>
    <div class="epic__sky phase-dawn" data-epic-sky aria-hidden="true"></div>
    <div class="epic__clouds" data-epic-clouds aria-hidden="true">
      <span class="epic__cloud epic__cloud--1"></span>
      <span class="epic__cloud epic__cloud--2"></span>
      <span class="epic__cloud epic__cloud--3"></span>
    </div>
    <div class="epic__vignette" aria-hidden="true"></div>

    <div class="epic__particles" data-epic-particles aria-hidden="true">${particles(14)}</div>

    ${renderIcarusFigure()}

    <div class="epic__bottle" data-epic-bottle${heroHas3D ? ` data-glb-url="${assetUrl('models/bottle-vesper.glb')}"` : ''} aria-hidden="true">${bottleImg}</div>

    <div class="epic__caption">
      <h1 class="epic__line" data-epic-line="0">Born from desire.</h1>
      <p class="epic__line" data-epic-line="1">Made to be remembered.</p>
    </div>

    <div class="epic__caption-sub">
      <p class="epic__sub" data-epic-sub="0">He rose on wings of wax and feather, reaching for <span class="epic__accent">the sun</span>.</p>
      <p class="epic__sub" data-epic-sub="2">Too close. The wax began <span class="epic__accent">to weep</span>.</p>
      <p class="epic__sub" data-epic-sub="1">The sky would not hold him. He fell toward <span class="epic__accent">the sea</span>.</p>
      <p class="epic__sub" data-epic-sub="3">The sea <span class="epic__accent">kept</span> what the sky refused.</p>
    </div>

    <div class="epic__actions" data-epic-actions>
      <a href="${url('/men/')}" class="btn btn-primary btn-magnetic" data-testid="hero-shop-men">Shop Men</a>
      <a href="${url('/women/')}" class="btn btn-ghost btn-magnetic" data-testid="hero-shop-women">Shop Women</a>
    </div>

    <div class="epic__cue" data-epic-cue>Scroll</div>
  </section>
  `;

  const menShowcase = showcase(men, { listId: 'home_gallery', listName: 'Homepage Gallery', gender: 'men' });
  const womenShowcase = showcase(women, { listId: 'home_gallery', listName: 'Homepage Gallery', gender: 'women' });

  const gallery = `
  <section class="gallery">
    <div class="container">
      <div class="gallery__head reveal">
        <h2 class="gallery__title">The Compositions</h2>
        <div class="gallery__switcher" data-gallery-switcher>
          <button type="button" data-gender-btn="men" class="is-active" data-testid="gallery-switch-men">Men<span class="gallery__switcher-dot"></span></button>
          <span class="gallery__switcher-sep">&middot;</span>
          <button type="button" data-gender-btn="women" data-testid="gallery-switch-women">Women<span class="gallery__switcher-dot"></span></button>
        </div>
      </div>
      <div class="gallery__stage">
        <div class="gallery__set" data-gallery-set="men" data-testid="home-men-grid">${menShowcase}</div>
        <div class="gallery__set" data-gallery-set="women" data-testid="home-women-grid">${womenShowcase}</div>
      </div>
    </div>
  </section>
  `;

  const bodyHtml = `
  ${epic}

  ${gallery}
  `;

  const pageData = {
    type: 'home',
    listId: 'home_gallery',
    listName: 'Homepage Gallery',
    items: men.concat(women).map((p, i) => ({ slug: p.slug, name: p.name, price: p.price, category: p.genderLabel, variant: '50ml' })),
  };

  const jsonLd = wrapGraph([organizationNode(), brandNode(), websiteNode()]);

  const anyHas3D = heroHas3D || men.concat(women).some((p) => hasModel(p.slug));
  const importMap = anyHas3D ? `<script type="importmap">{"imports":{"three":"${url('/js/vendor/three.module.min.js')}"}}</script>` : '';
  const viewerScript = anyHas3D ? `<script type="module" src="${url('/js/bottle-viewer.js')}"></script>` : '';
  const cinematicScripts = `<script src="${url('/js/vendor/gsap.min.js')}"></script>
<script src="${url('/js/vendor/ScrollTrigger.min.js')}"></script>
<script src="${url('/js/vendor/lenis.min.js')}"></script>
${viewerScript}
<script src="${url('/js/icarus-cinematic.js')}" defer></script>`;

  const html = renderPage({
    title: 'IKARIS Maison de Parfum — Original Fragrance, Kolkata',
    description: 'Six original eau de parfum compositions from Kolkata, ₹3,500–4,200. No dupes, no clones — real perfumery with presentation worth leaving on a shelf.',
    canonicalPath: '/',
    ogType: 'website',
    pageType: 'home',
    bodyHtml,
    pageData,
    extraHead: importMap,
    extraBodyScripts: cinematicScripts,
    jsonLd,
  });

  return { path: '/', html };
}

module.exports = { build };
