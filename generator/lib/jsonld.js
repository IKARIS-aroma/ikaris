const { BRAND, SITE_URL, CONTACT } = require('../../data/site');
const { absoluteUrl } = require('./urls');

const LOGO_MARK_PATH = '/assets/logo-mark.png';

function wrapGraph(nodes) {
  return { '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) };
}

function organizationNode() {
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: BRAND.name,
    alternateName: `${BRAND.name} ${BRAND.descriptor}`,
    url: SITE_URL + '/',
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl(LOGO_MARK_PATH),
      width: 520,
      height: 496,
    },
    foundingDate: BRAND.established,
    slogan: BRAND.tagline,
  };
}

function brandNode() {
  return {
    '@type': 'Brand',
    '@id': `${SITE_URL}/#brand`,
    name: BRAND.name,
    slogan: BRAND.tagline,
    logo: absoluteUrl(LOGO_MARK_PATH),
  };
}

function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: `${BRAND.name} — ${BRAND.descriptor}`,
    url: SITE_URL + '/',
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'en-IN',
  };
}

function breadcrumbListNode(items) {
  // items: [{ name, path }] in order, path is site-root-relative (no BASE_PATH)
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

function productNode(product, path, imagePath, priceValidUntil) {
  return {
    '@type': 'Product',
    '@id': absoluteUrl(path) + '#product',
    name: `${product.name} — IKARIS`,
    description: product.description,
    brand: { '@id': `${SITE_URL}/#brand` },
    category: product.genderLabel,
    image: absoluteUrl(imagePath),
    url: absoluteUrl(path),
    sku: product.slug,
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(path),
      priceCurrency: 'INR',
      price: product.price,
      availability: 'https://schema.org/InStock',
      priceValidUntil,
      itemCondition: 'https://schema.org/NewCondition',
    },
    // Deliberately no aggregateRating / Review: IKARIS has no real customers
    // yet, and fabricating review markup violates Google's structured data
    // guidelines on review snippets. Leave this out rather than fake it.
  };
}

function itemListNode(name, items) {
  return {
    '@type': 'ItemList',
    name,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(it.path),
      name: it.name,
    })),
  };
}

function articleNode(guide, path, imagePath) {
  return {
    '@type': 'Article',
    '@id': absoluteUrl(path) + '#article',
    headline: guide.title,
    description: guide.metaDescription,
    datePublished: guide.datePublished,
    dateModified: guide.dateModified,
    image: absoluteUrl(imagePath),
    author: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntityOfPage: absoluteUrl(path),
    inLanguage: 'en-IN',
  };
}

function faqPageNode(faq) {
  return {
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

function contactPointNode() {
  return {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: CONTACT.email,
    areaServed: 'IN',
    availableLanguage: ['en'],
  };
}

module.exports = {
  wrapGraph,
  organizationNode,
  brandNode,
  websiteNode,
  breadcrumbListNode,
  productNode,
  itemListNode,
  articleNode,
  faqPageNode,
  contactPointNode,
};
