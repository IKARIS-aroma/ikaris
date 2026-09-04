# IKARIS — build brief

Paste this whole file as your first message to Claude Code.

---

## 1. What you are building

A complete, production-quality e-commerce website for **IKARIS**, a fictional niche
perfume house. This is a **university assignment** for a Digital Marketing course. The
site must be genuinely live, genuinely optimised, and genuinely measurable — but no real
transaction ever takes place.

The assignment has three parts, and every decision you make should serve them:

1. Build a website and optimise it for search engines
2. Promote it through social and mobile channels
3. Conduct web analytics on it

So: real SEO, real structured data, real Google Analytics 4 e-commerce events, real
performance. Simulated checkout only.

**Critical constraint:** the site must never take money, never collect card details, and
never imply a real order will be fulfilled. The checkout is a simulation that fires
analytics events. There must be a discreet, permanent line in the footer identifying this
as a student demonstration project.

---

## 2. The brand

| | |
|---|---|
| **Name** | IKARIS |
| **Descriptor** | Maison de Parfum |
| **Established** | 2026 |
| **Tagline** | Born from desire. Made to be remembered. |
| **Origin** | Kolkata, India. Ships India-wide. |

### Positioning

The perfume market splits four ways: luxury houses most people cannot afford; high-street
brands whose scents are fine but whose bottles feel disposable; cheap deodorants; and
clone houses selling luxury note structures in mediocre packaging.

IKARIS occupies the gap none of them fill — **original compositions at ₹2,500–3,000, with
branding and presentation that feel genuinely premium.** A bottle you would leave out on a
shelf, and talk about, without having to justify the price.

This positioning must come through in every piece of copy. Never mention other brands.
Never use the words "dupe", "inspired by", or "alternative to".

### Visual direction

Take the direction from the supplied product photography: deep shadow, warm gold, stone
and marble surfaces, single-source dramatic lighting.

```
--ink        #0B0B0D    near-black, primary background
--ink-2      #141418    raised surfaces
--gold       #C9A227    primary accent, used sparingly
--gold-soft  #E3CE8E    hover and highlights
--bone       #F3EFE7    primary text on dark
--muted      #9A958C    secondary text
--line       #26262B    hairline borders
```

**Dark theme throughout.** This is a luxury fragrance site, not a SaaS dashboard.

Typography: a high-contrast serif for headings and the wordmark (Cormorant Garamond,
Playfair Display or similar), a clean sans for body and UI (Inter, Jost or system stack).
Wide letter-spacing on the wordmark and on small-caps labels — see the logo.

Restraint is the brief. Generous whitespace, very few colours, no gradients except in
photography, no drop shadows on UI elements, no rounded corners above 4px.

---

## 3. The products

Ten fragrances, 50ml eau de parfum, split into two collections. All prices in INR.

### Men

| Slug | Name | Price | Top | Heart | Base | Character |
|---|---|---|---|---|---|---|
| `noir` | Noir | ₹2,800 | Bergamot, pink pepper, cardamom | Black tea, incense, violet leaf | Oud, leather, vetiver | Dark, smoky, formal |
| `vesper` | Vesper | ₹2,800 | Violet leaf, grapefruit | Iris, lavender, clary sage | Ambergris, cedar, white musk | Cool, blue, evening |
| `monarch` | Monarch | ₹3,000 | Saffron, bergamot | Honeyed tobacco, Turkish rose | Amber, sandalwood, benzoin | Regal, warm, opulent |
| `inferno` | Inferno | ₹3,000 | Blood orange, black pepper | Cinnamon, smoked birch | Charred vetiver, labdanum, tonka | Hot, spiced, bold |
| `atlas` | Atlas | ₹2,500 | Grapefruit, sea salt | Juniper, mineral accord, geranium | Grey amber, driftwood, oakmoss | Clean, mineral, open |

### Women

| Slug | Name | Price | Top | Heart | Base | Character |
|---|---|---|---|---|---|---|
| `iris` | Iris | ₹2,800 | Bergamot, violet leaf | Orris root, jasmine | Cashmere musk, sandalwood | Powdery, refined, quiet |
| `opalite` | Opalite | ₹2,500 | Pear, freesia | White peony, magnolia | White musk, blonde cedar, vanilla | Luminous, clean, soft |
| `amor` | Amor | ₹2,800 | Lychee, pink pepper | Turkish rose, peony | Vanilla, patchouli, musk | Romantic, sweet, close |
| `solstice` | Solstice | ₹3,000 | Mandarin, neroli | Orange blossom, tuberose | Amber, honey, sandalwood | Golden, radiant, warm |
| `reverie` | Reverie | ₹2,500 | Bergamot, blackcurrant | Lilac, heliotrope, iris | Powdery musk, benzoin, vanilla | Dreamy, soft, nostalgic |

### Discovery sets

| Slug | Name | Price | Contents |
|---|---|---|---|
| `discovery-men` | The Men's Discovery Set | ₹599 | All five men's fragrances, 2ml each |
| `discovery-women` | The Women's Discovery Set | ₹599 | All five women's fragrances, 2ml each |
| `discovery-complete` | The Complete Set | ₹999 | All ten fragrances, 2ml each |

**Every discovery set is fully credited against the customer's first full bottle.** Say
this everywhere the sets appear — it is the core acquisition mechanic and it needs to be
unmissable.

### Copy rules for product descriptions

Write 70–100 words per fragrance. Rules:

- Open with a concrete image or moment, not an adjective
- Describe how it opens, how it settles, how it ends — the actual wearing experience
- One line on when to wear it
- No superlatives. No "indulge", "immerse", "elevate", "captivating", "exquisite",
  "journey", "symphony", "olfactory adventure"
- No exclamation marks
- Short sentences. Confidence, not decoration

Also give every product: longevity (6–8 hours etc.), sillage (intimate / moderate /
strong), and best season. Keep these plausible and varied — not every fragrance is
"strong, 12 hours, all seasons".

---

## 4. Site structure

```
/                                                Home
/men/                                            Men's collection
/women/                                          Women's collection
/fragrances/noir/                                Product page  ×10
/fragrances/vesper/
/fragrances/monarch/
/fragrances/inferno/
/fragrances/atlas/
/fragrances/iris/
/fragrances/opalite/
/fragrances/amor/
/fragrances/solstice/
/fragrances/reverie/
/discovery/                                      Discovery sets
/about/                                          The house
/guides/                                         Guides index
/guides/how-to-choose-a-perfume/                 Editorial / SEO
/guides/eau-de-parfum-vs-eau-de-toilette/
/guides/how-to-make-perfume-last-longer/
/guides/fragrance-notes-explained/
/cart/                                           Cart
/checkout/                                       Simulated checkout
/order-confirmed/                                Confirmation (noindex)
/contact/
/shipping-and-returns/
/privacy/
/404.html
```

Twenty-six pages. Every product reachable in two clicks from home.

The four guides exist to give the site organic search surface — product pages alone will
never rank for anything informational. Write them properly: 800–1,200 words each,
genuinely useful, targeting real searches like "how to choose a perfume", "difference
between EDP and EDT", "how to make perfume last longer", "perfume notes explained".

---

## 5. Technical requirements

### Stack

Plain static HTML, CSS and vanilla JavaScript. **No framework, no build step, no npm
dependencies at runtime.** It must deploy to GitHub Pages by uploading files.

You may write a Python or Node generator script that produces the HTML from a single data
file — in fact please do, it keeps the SEO tags consistent across 26 pages and makes
adding a product trivial. But the deployed output must be plain files.

### Per-page SEO (all 26 pages, no exceptions)

- Unique `<title>`, 50–60 characters including the brand suffix
- Unique meta description, 140–160 characters, written as ad copy not summary
- Self-referencing absolute canonical
- Exactly one `<h1>`
- Logical H2/H3 hierarchy, never skipped
- `<html lang="en-IN">`
- Open Graph: type, site_name, title, description, url, image, image:width,
  image:height, image:alt, locale
- Twitter card: summary_large_image
- Meta robots (noindex on `/order-confirmed/` and `/404.html`)
- Descriptive alt text on every image
- Visible breadcrumbs on every page below the homepage

### Structured data (JSON-LD, one `@graph` per page)

- `Organization` / `Brand` sitewide, with logo
- `WebSite` sitewide
- `Product` on all 13 product pages, with `Offer` — price, priceCurrency INR,
  availability, priceValidUntil, url
- `ItemList` on `/men/`, `/women/`, `/discovery/`
- `BreadcrumbList` everywhere below home
- `Article` on the four guides
- `FAQPage` on at least two pages
- `ContactPoint` on `/contact/`

**Do not add `aggregateRating` or `Review` markup.** There are no real customers, and
fabricated review markup violates Google's structured data policies. Leave it out and note
the reason in a code comment — that decision is worth marks.

### The cart and simulated checkout

No backend exists. Build it client-side:

- Cart state in `localStorage`, wrapped in try/catch — it can throw in private browsing
- Cart badge in the header showing item count, updating live
- Add to cart from both product pages and collection cards
- Quantity adjustment and removal in `/cart/`
- `/checkout/` collects name, email, address, and a **payment method choice only** —
  never a card number field, never a CVV field, not even a disabled one
- Submitting checkout goes to `/order-confirmed/`, generates a plausible order reference,
  clears the cart, and fires `purchase`
- `/order-confirmed/` must state plainly that this is a demonstration and no order has
  been placed and no payment taken

### Analytics

See section 6. It is the largest single requirement in this brief — read it before you
write any tracking code at all.

### Performance and mobile

- Mobile-first. Test at 320px — no horizontal scroll at any width
- All tap targets at least 44px
- All form inputs at 16px minimum, or iOS zooms the page on focus
- Product images: `loading="lazy"` below the fold, explicit `width` and `height` on every
  image to prevent layout shift, `<picture>` with WebP and JPEG fallback
- Fonts: at most two families, `font-display: swap`, preconnect to the font host
- Target Largest Contentful Paint under 2.5s on mobile
- No render-blocking JavaScript

### Accessibility

Skip-to-content link, visible focus states, ARIA on the mobile nav and cart drawer,
sufficient contrast against the dark background (check the muted grey — it often fails),
and full keyboard operability of the entire purchase flow.

### Sitemap, robots, and misc

- `sitemap.xml` listing all 24 indexable URLs with lastmod
- `robots.txt` allowing all, disallowing `/order-confirmed/` and `/404.html`, declaring
  the sitemap
- `.nojekyll` in the repo root
- Custom `404.html`, on-brand, with routes back into the catalogue
- Favicon from the supplied logo mark

---

## 6. Analytics architecture

Analytics is the heaviest-weighted part of this assignment. The site must be readable by
**any** analytics tool, not just Google Analytics, because we may add tools later and
because the report compares what different tools can and cannot see.

### The core principle: dataLayer first, tools second

Do **not** hardcode `gtag()` calls throughout the site. Instead:

1. Every meaningful interaction pushes a normalised event object to `window.dataLayer`
2. Tools subscribe to that dataLayer
3. Adding Meta Pixel, Clarity or Matomo later requires zero changes to page code

This is the single most important architectural decision in the build. One event
definition, many consumers.

```js
// The only function that should ever emit an event.
function track(eventName, payload = {}) {
  window.dataLayer = window.dataLayer || [];
  const evt = {
    event: eventName,
    timestamp: new Date().toISOString(),
    page_type: document.body.dataset.pageType,      // home | collection | product | cart | checkout | confirmation | guide | page
    page_category: document.body.dataset.pageCategory || null,   // men | women | discovery | null
    visitor_id: getVisitorId(),                      // first-party, anonymous, localStorage
    session_id: getSessionId(),
    ...payload
  };
  window.dataLayer.push(evt);
  if (window.IKARIS_DEBUG) console.log('[track]', eventName, evt);
}
```

Every page must carry `data-page-type` and, where relevant, `data-page-category` on
`<body>`. Analytics tools and tag managers key off these constantly, and retrofitting them
is miserable.

### Tag manager

Include a **Google Tag Manager** container snippet with a `GTM_CONTAINER_ID` placeholder,
in both `<head>` and the `<noscript>` immediately after `<body>`.

Also include a direct GA4 gtag.js fallback controlled by one config flag:

```js
const ANALYTICS = {
  GTM_CONTAINER_ID: 'GTM-XXXXXXX',
  GA4_MEASUREMENT_ID: 'G-XXXXXXXXXX',
  USE_DIRECT_GA4: true,     // set false once GTM is configured to handle GA4
  CLARITY_PROJECT_ID: '',   // optional
  META_PIXEL_ID: '',        // optional
  DEBUG: false
};
```

When `USE_DIRECT_GA4` is true, a small bridge forwards dataLayer events to gtag so the site
works immediately without any GTM configuration. When GTM is set up, flip it to false to
avoid double-counting. Document this clearly in the README — double-counted purchases are
the classic way a student analytics report ends up wrong.

### Events to implement

Standard GA4 e-commerce, with exactly the official parameter shapes:

| Event | Fires when |
|---|---|
| `view_item_list` | A collection page loads |
| `select_item` | A product card is clicked |
| `view_item` | A product page loads |
| `add_to_cart` | Add to cart, anywhere |
| `remove_from_cart` | Item removed in the cart |
| `view_cart` | `/cart/` loads |
| `begin_checkout` | `/checkout/` loads |
| `add_shipping_info` | Delivery details submitted |
| `add_payment_info` | Payment method selected |
| `purchase` | `/order-confirmed/` loads |

Every one carries an `items` array with `item_id`, `item_name`, `item_category`
(Men / Women / Discovery), `item_variant` (50ml / 2ml), `price`, `quantity`,
`index`, and `currency: "INR"`. `purchase` also carries `transaction_id` and `value`.

Custom events, for the questions this brand actually cares about:

| Event | Fires when | Why it matters |
|---|---|---|
| `view_notes` | Note pyramid expanded | Do buyers read the notes before adding? |
| `discovery_set_click` | Any discovery-set CTA | Is the entry product doing its job? |
| `guide_complete` | Reader reaches end of a guide | Real readership vs arrivals |
| `filter_use` | Collection filter or sort used | How people navigate the catalogue |
| `price_band_view` | Product page loads | Fires with band 2500 / 2800 / 3000 |
| `scroll_depth` | 25 / 50 / 75 / 100% | Engagement, independent of GA4 defaults |
| `outbound_click` | Any external link | |
| `cart_abandoned` | Leaves `/checkout/` without purchase | The most valuable event on the site |

Use a `data-ev="event_name"` attribute pattern so any new button is tracked automatically
without touching JavaScript.

### Make the site legible to session-recording and heatmap tools

Microsoft Clarity is free with unlimited sessions, gives heatmaps and session replay, and
produces exactly the kind of screenshot that makes an analytics report convincing. Build
for it:

- **Stable, semantic class names and IDs.** No hashed or randomly generated class names.
  Heatmap tools group by selector; unstable selectors destroy the data.
- **`data-testid` on every interactive element** — `data-testid="add-to-cart"`,
  `"checkout-submit"`, `"filter-price"`. Tools and QA both key off these.
- **Real, distinct URLs for every state.** No SPA routing, no `#` fragments for navigation.
  Every tool tracks page views natively this way.
- **Never put personal data in the DOM or in an event.** Mask the name, email and address
  fields with `data-clarity-mask="true"` and the equivalent attributes. No PII in the
  dataLayer, ever — that is both a privacy requirement and a Google Analytics terms
  violation.

### First-touch attribution

Static hosting means no server-side attribution, so capture it client-side:

- On first visit, read `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`,
  `utm_term`, plus `document.referrer` and any `gclid` / `fbclid`
- Store as **first touch** in localStorage, and never overwrite it
- Track **last touch** separately, updated each visit
- Attach both to `purchase`

This lets the report compare first-touch and last-touch attribution on the same data,
which is a genuinely interesting thing to write about and almost nobody at this level does
it.

### Exclude your own traffic

You and your group will visit this site hundreds of times while building it. Left
unfiltered, your own sessions will dominate the dataset and make every conclusion wrong.

- Visiting `?internal=1` sets a long-lived localStorage flag
- While set, every event carries `traffic_type: "internal"`
- `?internal=0` clears it
- Show a small fixed badge in the corner when internal mode is on, so it is obvious
- Document how to set up the matching GA4 internal-traffic filter in the README

### A debug page

Build `/analytics-debug/`, noindex, not linked from the navigation. It shows:

- The current config, with IDs partially masked
- Whether GTM, GA4, Clarity and the Pixel actually loaded
- A live table of the last 50 dataLayer pushes, newest first, with a JSON view
- Current cart contents, visitor ID, session ID, first-touch and last-touch attribution
- Buttons to fire each event manually for testing
- A "copy all events as JSON" button

This is a QA tool and it is also the single most useful screenshot in the final report —
it shows the events firing with correct payloads, which is hard evidence that the tracking
works.

### Consent and privacy

India's DPDP Act 2023 and general good practice both apply, and a marked assignment should
show awareness of them:

- A cookie consent banner: accept, reject, and a link to the privacy page
- **Google Consent Mode v2** defaults set to denied before any tag fires, updated on
  consent
- Analytics loads only after consent, except for strictly necessary functionality
- The choice persists in localStorage
- A real privacy page explaining what is collected and why, and noting the site is a
  student project that processes no real orders and takes no payments

### Search and performance tools

- **Google Search Console** verification meta tag placeholder in `<head>`
- **Bing Webmaster Tools** verification meta tag placeholder — free, and gives a second
  independent source of query data for the report
- Clean `sitemap.xml` and `robots.txt`, since every crawler-based tool reads them
- Ensure the site scores well in Lighthouse, because PageSpeed Insights and Core Web
  Vitals are part of the analytics story

### What to write in the README

A table listing every event, when it fires, which parameters it carries, and which tool
consumes it. That table is directly liftable into the assignment report, and it is the
thing that proves the tracking was designed rather than sprinkled on at the end.

---

## 7. Assets

Supplied in `/assets/`, uploaded separately:

```
assets/logo-full.jpg            full lockup: emblem + IKARIS wordmark + descriptor
assets/logo-mark.jpg            emblem only, for the header and favicon
assets/products/<slug>.jpg      10 product shots, portrait, ~614×1024
assets/thumbs/<slug>.jpg        10 square crops, 600×600, for cards and OG images
```

Slugs are exactly: `noir vesper monarch inferno atlas iris opalite amor solstice reverie`

The logo files have white backgrounds. On the dark theme, either knock the white out to
transparency, or place the mark inside a light panel — do not leave a white rectangle
floating on black.

Generate a 1200×630 Open Graph image for the site. Product pages should use their own
square thumbnail as the OG image.

---

## 8. Deployment

GitHub Pages, on a fresh account.

- If the repository is named `<username>.github.io`, the site serves at the root — use
  root-relative internal links (`/men/`)
- If it is named anything else, it serves at `/<repo>/` — every internal link and the
  canonical URLs must carry that prefix

Ask which before you write a single link. Getting this wrong breaks every link on the
site and it is tedious to fix afterwards.

---

## 9. Build a self-audit script

Write `audit.py` (or `.js`) that walks every built HTML file and reports:

- Title length, flagging anything outside 15–65 characters
- Meta description length, flagging anything outside 70–165
- H1 count, flagging anything that is not exactly 1
- Missing canonical, viewport, or `lang`
- Images without alt text
- JSON-LD that fails to parse
- Word count per page
- Whether every sitemap URL exists as a file, and every page appears in the sitemap
- Every page carries `data-page-type` on `<body>`
- No page contains a hardcoded `gtag(` call outside the analytics bridge
- No `<input>` collecting a name, email or address is missing its masking attribute
- No element uses a hashed or randomly generated class name

Run it, fix everything it finds, and run it again until it reports zero issues. Show me
the before and after output — the fixes are evidence for the report.

---

## 10. Definition of done

- [ ] All 26 pages build and every internal link resolves
- [ ] `audit.py` reports zero issues
- [ ] All JSON-LD validates at validator.schema.org
- [ ] Full purchase flow works end to end: browse → product → cart → checkout → confirmed
- [ ] All ten e-commerce events fire with correct `items` payloads, verified in GA4
      DebugView and visible in `/analytics-debug/`
- [ ] Every event also lands in `window.dataLayer` in the normalised shape
- [ ] No event fires before consent is given
- [ ] `?internal=1` marks traffic correctly and shows the badge
- [ ] First-touch attribution survives a second visit from a different source
- [ ] `cart_abandoned` fires when leaving checkout without purchasing
- [ ] Flipping `USE_DIRECT_GA4` to false stops direct GA4 sending, with no double-count
- [ ] Cart survives a page reload, and does not crash in private browsing
- [ ] No horizontal scroll at 320px, on any page
- [ ] Site is legible and on-brand on a phone
- [ ] Student-project disclosure present in the footer and on the confirmation page
- [ ] No card number field exists anywhere in the codebase
- [ ] `README.md` documents deployment, the GA4 setup, and how to add a product

---

## 11. Order of work

1. Confirm the repository name and therefore the URL structure
2. Data file with all 13 products and the site config
3. Generator script and shared layout with the full SEO head
4. Home, collections, one product page — get the design right before repeating it
5. Remaining product pages, discovery, about, contact, policy pages
6. The analytics layer — `track()`, dataLayer shape, config block, consent, attribution,
   internal-traffic flag, `/analytics-debug/`. Build this **before** the cart, so the cart
   is instrumented as it is written rather than retrofitted
7. Cart, checkout, confirmation, wired to the analytics layer
8. The four guides
9. Sitemap, robots, 404, favicon, OG images
10. `audit.py`, then fix everything it finds
11. `README.md`, including the full event reference table

Show me the homepage and one product page rendered before you build the other nine. It is
much cheaper to change the design once than ten times.
