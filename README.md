# IKARIS — Maison de Parfum

A static, data-driven e-commerce site built for a digital marketing coursework
assignment: SEO, social/mobile promotion, and web analytics on a real (but
non-transacting) storefront. No backend, no framework, no build step in the
deployed output — plain HTML/CSS/JS generated from a single data file.

**This is a student demonstration project. No real payment is ever collected
and no order is ever fulfilled.** See the footer disclosure on every page and
`/order-confirmed/`.

---

## 1. Toolchain

The generator and audit script are written in **Node.js** (not Python) —
this machine only had Node available, so both tools that the brief allows in
either language were built in Node to keep everything runnable end to end.
Node 18+ is required to run the generator; nothing beyond Node's standard
library plus `sharp` (dev-only, for image processing) is used.

```bash
npm install          # installs sharp, used only by generator/process-assets.js
node generator/process-assets.js   # one-off: knock out logo backgrounds, build WebP/favicons/OG image
node generator/build.js            # generates the whole site into /docs
node audit.js                      # self-audit — must report zero issues
node generator/check-links.js      # crawls every internal href in /docs and confirms it resolves
node generator/serve.js            # local preview server, matching the deployed root-path serving
```

The deployed output (`/docs`) is plain static files — no Node, npm, or build
step is needed to serve it.

---

## 2. Deployment (Cloudflare)

Migrated off GitHub Pages (which serves project repos at a forced `/ikaris`
subpath) to **Cloudflare** — currently a Worker with static assets serving
`/docs` from `https://ikaris.official-debjitm.workers.dev`, which serves at
the domain root, supports a `_headers` file for response caching, and gets
automatic Brotli compression — none of which GitHub Pages offers.
`BASE_PATH` in `data/site.js` is now `''`; every internal link, canonical
URL, sitemap entry, and JSON-LD `@id` is root-relative to match. If the
assigned domain or hosting product ever changes (e.g. moving to Cloudflare
Pages proper, or attaching a custom domain), update `SITE_DOMAIN` in
`data/site.js` to match, then `node generator/build.js` and commit the
rebuilt `/docs`.

`generator/build.js` writes `docs/_headers` on every build (immutable
caching for `/assets/*` and `/js/*`, since those paths never change content
at the same URL — hashless HTML still revalidates on every load). Cloudflare
Pages reads this file automatically; Workers-with-assets deployments honor
the same convention, but verify caching headers on a real response
(`curl -I`) if you swap the underlying product.

**If you still have GitHub Pages enabled for this repo**: it will keep
serving whatever was last committed, but every internal link is now
root-relative (e.g. `/men/`), which resolves incorrectly under GitHub
Pages' `/ikaris/` subpath — effectively broken for that host the moment
this change merges. Disable GitHub Pages (Settings → Pages → source: None)
once Cloudflare is confirmed live, or revert `BASE_PATH` to `'/ikaris'` and
`SITE_DOMAIN` to the `github.io` value if you need to keep both hosts
working simultaneously.

---

## 3. How to add or edit a product

Everything about the six fragrances lives in
[`data/products.js`](data/products.js). To add a seventh fragrance:

1. Add a JPEG to `assets/products/<slug>.jpg` (portrait) and
   `assets/thumbs/<slug>.jpg` (square).
2. Run `node generator/process-assets.js` to generate its WebP siblings.
3. Add an entry to the `PRODUCTS` array in `data/products.js` with the same
   shape as the existing six (slug, name, gender, price, notes, character,
   description, longevity, sillage, season, alt text).
4. Run `node generator/build.js` — the new product page, its entry in both
   the men's/women's collection grid, the sitemap, and its `Product` JSON-LD
   are all generated automatically.
5. Run `node audit.js` and fix anything it flags (usually a description
   length outside 70–100 words or a missing note).

The four guides live in `data/guides.js` as arrays of content blocks
(`h2`, `p`, `ul`, `ol`) — add a new guide the same way and it appears in the
guides index and sitemap automatically.

---

## 4. Design notes

**Visual direction.** Dark theme (`--ink` / `--gold` / `--bone`), Cormorant
Garamond for display type, Jost for UI, per the brand brief.

**The "experience layer"** (`src/js/experience.js` + the relevant CSS in
`src/css/style.css`) is a from-scratch interactive treatment inspired by
sites like Santioni Spirits and STILL — custom cursor, kinetic type reveals,
a marquee ticker, giant ghost-type watermarks, and scroll reveals. The
homepage hero (`src/js/icarus-scroll.js`) tells the Icarus myth as a
scroll-scrubbed sequence using the brand's own logo artwork, animated
through a keyframed flight path, since no illustration-generation tool was
available to author new comic-panel art the way a reference site like
Santioni's (built by Active Theory + an illustration studio) does.

**Interactive 3D product viewer** (`src/js/bottle-viewer.js`, real Three.js/
WebGL, self-hosted — see `src/js/vendor/`). Each bottle is a genuine 3D
model: a shared faceted base geometry (`blender/build_bottles.py`, run
headlessly) tinted per fragrance from `data/products.js`'s `render3d` field
(glass/liquid colour, cap colour and metal finish) with a wrap-around label
plaque carrying the real IKARIS emblem, exported to `assets/models/
bottle-<slug>.glb`. On the product page it's genuinely draggable
(OrbitControls, damped, auto-rotates when idle) — not a photo trick. Where a
product has no `.glb` yet, or the browser has no WebGL, the page falls back
to the static product photo already in the DOM; nothing is ever broken or
empty. Every animated/interactive layer here is progressive enhancement:
real content sits in the DOM regardless of JavaScript, and
`prefers-reduced-motion` strips the scroll-jacked hero down to a static
resting frame.

**No `aggregateRating` or `Review` schema.** IKARIS has no real customers,
and fabricated review markup violates Google's structured data policies —
see the comment in `generator/lib/jsonld.js`.

---

## 5. Analytics architecture

**dataLayer first, tools second.** Every meaningful interaction calls
`window.track(eventName, payload)` (defined in `src/js/analytics.js`), which
normalises the event, pushes it to `window.dataLayer`, mirrors it into a
per-session debug log, and — only once analytics consent is granted —
forwards it to GA4 direct. No page code ever calls `gtag()` directly.

### Config block (`data/site.js` → `ANALYTICS`)

```js
{
  GTM_CONTAINER_ID: 'GTM-XXXXXXX',   // replace with your real container ID
  GA4_MEASUREMENT_ID: 'G-XXXXXXXXXX',// replace with your real measurement ID
  USE_DIRECT_GA4: true,              // see below
  CLARITY_PROJECT_ID: '',            // optional
  META_PIXEL_ID: '',                 // optional
  DEBUG: false,
}
```

**`USE_DIRECT_GA4`** controls a bridge that forwards every `track()` call
straight to `gtag('event', ...)` so the site reports to GA4 immediately,
without any GTM configuration. Once you've built out GA4 tracking *inside*
GTM (recommended for anything beyond a class project), **set this to
`false`** — otherwise GTM's GA4 tag and the direct bridge will both send the
same events, double-counting every pageview, add-to-cart, and purchase in
your GA4 property. This is the single most common way a student analytics
report ends up with numbers that don't add up.

### Consent

Google Consent Mode v2 defaults (`ad_storage`, `analytics_storage`,
`ad_user_data`, `ad_personalization`: all `denied`) are set inline in
`<head>`, before GTM or any vendor script loads. The cookie banner
(bottom of every page) writes the visitor's choice to `localStorage` and
calls `gtag('consent', 'update', ...)`. `dataLayer` pushes always happen
(that's just local bookkeeping, not a third-party send) — but the GA4-direct
bridge, Microsoft Clarity, and the Meta Pixel only actually load or forward
data **after** consent is granted.

### Internal traffic exclusion

Visit any page with `?internal=1` to mark this browser as internal traffic —
every subsequent event carries `traffic_type: "internal"`, and a red
"INTERNAL TRAFFIC" badge appears bottom-left as a visible reminder.
`?internal=0` clears it.

**To set up the matching GA4 filter**: GA4 → Admin → Data Streams → your
stream → configure tag settings → Define internal traffic, and add a rule
matching a custom parameter. Since this site marks traffic client-side
rather than by IP, the cleanest approach is: create a GA4 custom dimension
scoped to "event" for `traffic_type`, then build an Explore/segment that
excludes `traffic_type = internal` — GA4's built-in "internal traffic" IP
filter won't see this flag, since it's not IP-based.

### First-touch vs last-touch attribution

On every page load, `analytics.js` reads `utm_source/medium/campaign/content/
term`, `gclid`, `fbclid`, and `document.referrer`. The **first** set of
values a visitor ever arrives with is written once to `localStorage` and
never overwritten; the **last** set is overwritten on every visit. Both are
attached to the `purchase` event, so the same conversion data supports a
first-touch vs. last-touch comparison — genuinely useful for the report, and
not something a bare GA4 setup gives you by default.

### Debug console

`/analytics-debug/` (noindex, not linked from navigation) shows the current
config (IDs partially masked), whether GTM/GA4/Clarity/Pixel actually
loaded, a live table of the last 50 dataLayer pushes with a JSON view, cart
contents, visitor/session IDs, first- and last-touch attribution, a button
to fire each event manually, and a "copy all events as JSON" button. This is
also the best single screenshot for the assignment report — it's hard
evidence the tracking fires with correct payloads.

---

## 6. Event reference

Every event is a plain object pushed to `window.dataLayer`. All e-commerce
events carry `currency: "INR"` and an `items[]` array shaped to GA4's
standard e-commerce parameters (`item_id`, `item_name`, `item_category`,
`item_variant`, `price`, `quantity`, `index`).

| Event | Fires when | Key parameters | Consumed by |
|---|---|---|---|
| `view_item_list` | A collection/home section with product cards loads | `item_list_id`, `item_list_name`, `items[]` | GA4, GTM |
| `select_item` | A product card link is clicked | `item_list_id`, `item_list_name`, `items[]` | GA4, GTM |
| `view_item` | A product page loads | `currency`, `value`, `items[]` | GA4, GTM |
| `add_to_cart` | Add to cart, anywhere (product page or quick-add card) | `currency`, `value`, `items[]` | GA4, GTM, Meta Pixel |
| `remove_from_cart` | Item removed on `/cart/` | `currency`, `value`, `items[]` | GA4, GTM |
| `view_cart` | `/cart/` loads | `currency`, `value`, `items[]` | GA4, GTM |
| `begin_checkout` | `/checkout/` loads with a non-empty cart | `currency`, `value`, `items[]` | GA4, GTM, Meta Pixel |
| `add_shipping_info` | Delivery details form submitted | `currency`, `value`, `items[]`, `shipping_tier` | GA4, GTM |
| `add_payment_info` | Payment method radio selected | `currency`, `value`, `items[]`, `payment_type` | GA4, GTM |
| `purchase` | `/order-confirmed/` loads with a valid order snapshot | `transaction_id`, `currency`, `value`, `items[]`, `first_touch_*`, `last_touch_*` | GA4, GTM, Meta Pixel |
| `view_notes` | Note pyramid accordion opened (first time per page load) | `item_id` | GA4 (custom event) |
| `guide_complete` | Reader scrolls to the end of a guide | `guide_slug` | GA4 (custom event) |
| `filter_use` | Collection sort dropdown changed | `filter_type`, `filter_value` | GA4 (custom event) |
| `price_band_view` | Product page loads | `price_band` (2500 / 2800 / 3000) | GA4 (custom event) |
| `scroll_depth` | 25/50/75/100% of page scrolled | `depth_percent` | GA4 (custom event) |
| `outbound_click` | Any link to an external domain clicked | `link_url`, `link_domain` | GA4 (custom event) |
| `cart_abandoned` | Visitor leaves `/checkout/` without completing the order | `currency`, `value`, `items[]` | GA4 (custom event) |

Every event object also carries `event`, `timestamp`, `page_type`,
`page_category`, `visitor_id`, `session_id`, and `traffic_type` — see
`track()` in `src/js/analytics.js`.

---

## 7. Privacy / consent quick reference

- Analytics cookies/scripts load only after the visitor accepts the consent
  banner (`/privacy/` explains what's collected).
- No PII (name, email, address) is ever included in a dataLayer event.
- Checkout inputs that collect name/email/address carry
  `data-clarity-mask="true"` so session-recording tools mask them even if
  Clarity is enabled later.
- Cart and checkout logic wraps every `localStorage`/`sessionStorage` call in
  try/catch — it won't throw in private browsing, it just falls back to an
  in-memory cart for that page view.

---

## 8. Project structure

```
data/           product, guide, and site-config data (single source of truth)
generator/      Node build script + page templates + shared lib (SEO head, JSON-LD, layout)
src/css/        one stylesheet, dark theme + the interactive "experience layer"
src/js/         analytics.js, cart.js, main.js, experience.js, debug.js
assets/         source photography + generated WebP/favicons/OG image
docs/           BUILD OUTPUT — this is what GitHub Pages serves, do not hand-edit
audit.js        self-audit script — run after every build
```
