// Single source of truth for every fragrance.
// The generator (generator/build.js) reads this to produce all product and
// collection pages, plus the sitemap and JSON-LD.

const PRODUCTS = [
  {
    slug: 'noir',
    name: 'Noir',
    gender: 'men',
    genderLabel: 'Men',
    price: 3800,
    notes: {
      top: ['Bergamot', 'Pink pepper', 'Cardamom'],
      heart: ['Black tea', 'Incense', 'Violet leaf'],
      base: ['Oud', 'Leather', 'Vetiver'],
    },
    character: 'Dark, smoky, formal',
    longevity: '8-10 hours',
    sillage: 'Strong',
    season: 'Autumn and winter',
    description:
      "A black bottle catches lamplight on a bar top at ten in the evening. That's the opening: bergamot and pink pepper, sharpened by cardamom, gone within minutes. Black tea and incense settle in next, dry and a little smoky, with violet leaf keeping it from turning heavy. By the base, oud and leather have taken over, low and warm, vetiver holding the whole thing to the skin. Wear it to dinners that matter, or meetings where you'd rather not explain yourself.",
    alt: 'IKARIS Noir eau de parfum bottle in black glass with gold cap, set against dark stone',
    render3d: { glassColor: '#050403', liquidColor: '#2a1a10', capColor: '#0a0908', capMetal: 'gunmetal', bodyWidth: 0.60, bodyHeight: 1.08, taper: 0.76 },
  },
  {
    slug: 'vesper',
    name: 'Vesper',
    gender: 'men',
    genderLabel: 'Men',
    price: 3800,
    notes: {
      top: ['Violet leaf', 'Grapefruit'],
      heart: ['Iris', 'Lavender', 'Clary sage'],
      base: ['Ambergris', 'Cedar', 'White musk'],
    },
    character: 'Cool, blue, evening',
    longevity: '6-8 hours',
    sillage: 'Moderate',
    season: 'Spring and summer nights',
    description:
      'Ice in a glass, blue light off a hotel pool at dusk. Violet leaf and grapefruit open cool and slightly bitter, gone in the first ten minutes. Iris and lavender take the middle, dry and mineral, clary sage adding a whisper of green. The base is quiet: ambergris, cedar, white musk, closer to skin than air. It reads formal without trying, better after dark than before. Wear it to evenings that start late and end later.',
    alt: 'IKARIS Vesper eau de parfum bottle in cool blue-black glass on dark marble',
    render3d: { glassColor: '#101822', liquidColor: '#4a6a8a', capColor: '#282d34', capMetal: 'silver', bodyWidth: 0.56, bodyHeight: 1.12, taper: 0.82 },
  },
  {
    slug: 'monarch',
    name: 'Monarch',
    gender: 'men',
    genderLabel: 'Men',
    price: 4200,
    notes: {
      top: ['Saffron', 'Bergamot'],
      heart: ['Honeyed tobacco', 'Turkish rose'],
      base: ['Amber', 'Sandalwood', 'Benzoin'],
    },
    character: 'Regal, warm, opulent',
    longevity: '10-12 hours',
    sillage: 'Strong',
    season: 'Autumn and winter',
    description:
      "A tailor's fitting room, cedar shavings on the floor, afternoon light through tall windows. Saffron and bergamot open bright, almost sharp, before honeyed tobacco and Turkish rose take the middle and slow everything down. Amber, sandalwood and benzoin arrive last and stay for hours, warm rather than sweet. This is a fragrance for rooms with high ceilings and long conversations. Wear it when you are the one people remember leaving.",
    alt: 'IKARIS Monarch eau de parfum bottle in deep amber glass with gold detailing',
    render3d: { glassColor: '#28190b', liquidColor: '#6b4315', capColor: '#6e5220', capMetal: 'gold', bodyWidth: 0.64, bodyHeight: 1.05, taper: 0.72 },
  },
  {
    slug: 'iris',
    name: 'Iris',
    gender: 'women',
    genderLabel: 'Women',
    price: 3800,
    notes: {
      top: ['Bergamot', 'Violet leaf'],
      heart: ['Orris root', 'Jasmine'],
      base: ['Cashmere musk', 'Sandalwood'],
    },
    character: 'Powdery, refined, quiet',
    longevity: '6-8 hours',
    sillage: 'Intimate',
    season: 'All year, best in cooler weather',
    description:
      "Powder on a dressing table, a window left open to cold morning air. Bergamot and violet leaf open soft and slightly green, fading fast into orris root and jasmine, dry and a little dusty in the way good iris always is. Cashmere musk and sandalwood hold the base close to the skin, warm without being sweet. Quiet by design. Wear it to work, to meetings, to any room where perfume shouldn't announce itself first.",
    alt: 'IKARIS Iris eau de parfum bottle in soft mauve glass surrounded by iris flowers',
    render3d: { glassColor: '#3f3446', liquidColor: '#7a6488', capColor: '#5f5468', capMetal: 'silver', bodyWidth: 0.54, bodyHeight: 1.06, taper: 0.80 },
  },
  {
    slug: 'opalite',
    name: 'Opalite',
    gender: 'women',
    genderLabel: 'Women',
    price: 3500,
    notes: {
      top: ['Pear', 'Freesia'],
      heart: ['White peony', 'Magnolia'],
      base: ['White musk', 'Blonde cedar', 'Vanilla'],
    },
    character: 'Luminous, clean, soft',
    longevity: '6-8 hours',
    sillage: 'Intimate',
    season: 'Spring and summer, though it holds up year-round',
    description:
      'A white room, freesia on the windowsill, light coming through linen curtains. Pear and freesia open crisp and a little green, settling into white peony and magnolia within the hour. White musk, blonde cedar and vanilla close it out, soft and clean rather than sweet. This is the fragrance for mornings, for offices, for anyone who wants to be noticed only up close. Wear it daily, in any season.',
    alt: 'IKARIS Opalite eau de parfum bottle in pale iridescent glass on white marble',
    render3d: { glassColor: '#c9c3b6', liquidColor: '#eee6d4', capColor: '#cfc6ae', capMetal: 'gold', bodyWidth: 0.56, bodyHeight: 1.04, taper: 0.84 },
  },
  {
    slug: 'amor',
    name: 'Amor',
    gender: 'women',
    genderLabel: 'Women',
    price: 3800,
    notes: {
      top: ['Lychee', 'Pink pepper'],
      heart: ['Turkish rose', 'Peony'],
      base: ['Vanilla', 'Patchouli', 'Musk'],
    },
    character: 'Romantic, sweet, close',
    longevity: '8 hours',
    sillage: 'Moderate',
    season: 'Autumn, worn close',
    description:
      'Lychee cut open at a kitchen counter, pink pepper on the tongue. It opens fruit-forward and a little sharp, softening fast into Turkish rose and peony, full and unmistakably rose without turning old-fashioned. Vanilla, patchouli and musk settle in for the base, close to skin, warm through the evening. This is a fragrance for someone specific, not for a room. Wear it on dates, on skin, not on clothes.',
    alt: 'IKARIS Amor eau de parfum bottle in rose-pink glass surrounded by rose petals',
    render3d: { glassColor: '#4a222b', liquidColor: '#a2515e', capColor: '#7a5348', capMetal: 'gold', bodyWidth: 0.58, bodyHeight: 1.02, taper: 0.79 },
  },
];

module.exports = { PRODUCTS };
