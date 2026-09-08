// Sitewide configuration: brand facts, URL structure, and the analytics
// placeholder block described in the build brief. Edit SITE_DOMAIN once the
// hosting target exists (see README "Deployment").

// Migrated off GitHub Pages (which serves project repos at a /ikaris
// subpath, forcing every internal link, canonical, and JSON-LD @id to
// carry that prefix) to Cloudflare, which serves at the domain root —
// BASE_PATH is now empty. SITE_DOMAIN is the actual assigned
// *.workers.dev domain (a Cloudflare Worker with static assets, not
// Pages) — if you attach a custom domain later, update this to match.
const BASE_PATH = '';
const SITE_DOMAIN = 'https://ikaris.official-debjitm.workers.dev';
const SITE_URL = `${SITE_DOMAIN}${BASE_PATH}`;

const BRAND = {
  name: 'IKARIS',
  descriptor: 'Maison de Parfum',
  established: '2026',
  tagline: 'Born from desire. Made to be remembered.',
  origin: 'Kolkata, India',
  shipping: 'Ships India-wide',
  suffix: 'IKARIS', // used in <title> suffixes
};

// Every analytics ID here is a placeholder. See README "Analytics setup" for
// how to fill these in and what USE_DIRECT_GA4 controls.
const ANALYTICS = {
  GTM_CONTAINER_ID: 'GTM-XXXXXXX',
  GA4_MEASUREMENT_ID: 'G-LK98FXSEMF',
  USE_DIRECT_GA4: true,
  CLARITY_PROJECT_ID: '',
  META_PIXEL_ID: '',
  DEBUG: false,
};

const SEARCH_CONSOLE_VERIFICATION = 'PLACEHOLDER_GSC_VERIFICATION_TOKEN';
const BING_VERIFICATION = 'PLACEHOLDER_BING_VERIFICATION_TOKEN';

const NAV = [
  { label: 'Men', href: '/men/' },
  { label: 'Women', href: '/women/' },
  { label: 'Guides', href: '/guides/' },
  { label: 'The House', href: '/about/' },
];

const FOOTER_LINKS = [
  { label: 'Contact', href: '/contact/' },
  { label: 'Shipping & Returns', href: '/shipping-and-returns/' },
  { label: 'Privacy', href: '/privacy/' },
];

const CONTACT = {
  email: 'hello@ikaris.example',
  city: 'Kolkata, India',
};

module.exports = {
  BASE_PATH,
  SITE_DOMAIN,
  SITE_URL,
  BRAND,
  ANALYTICS,
  SEARCH_CONSOLE_VERIFICATION,
  BING_VERIFICATION,
  NAV,
  FOOTER_LINKS,
  CONTACT,
};
