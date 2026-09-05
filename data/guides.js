// The four editorial guides. Each is real, load-bearing content (800-1200
// words) that gives the site organic search surface beyond product pages.
// `blocks` renders in order as the article body; `faq` powers both the
// visible FAQ section and the FAQPage JSON-LD.

const GUIDES = [
  {
    slug: 'how-to-choose-a-perfume',
    title: 'How to Choose a Perfume',
    metaTitle: 'How to Choose a Perfume: Notes, Families, Fit | IKARIS',
    metaDescription:
      'A practical guide to choosing a perfume: the four scent families, why paper lies and skin tells the truth, and why the first ten seconds mislead you.',
    datePublished: '2026-02-10',
    dateModified: '2026-02-10',
    blocks: [
      {
        type: 'p',
        text: "Walk into any perfume counter and the choice looks arbitrary — hundreds of bottles, no obvious order, someone asking what you \"usually wear\" as if that settles anything. It isn't arbitrary. Fragrance breaks down into a small number of families and a fixed structure, and once you know both, choosing gets much faster.",
      },
      { type: 'h2', text: 'Start with what you already like wearing' },
      {
        type: 'p',
        text: "Before you smell a single new fragrance, think about what you already reach for. Do you prefer your coffee to your tea? Cotton to wool? These aren't silly comparisons — people drawn to citrus and green tea tend toward fresh, citrus-forward fragrances, while people drawn to dark chocolate and old books tend toward woody, ambery ones. Your existing preferences are the fastest filter you have, and it costs nothing to apply before you set foot near a counter.",
      },
      { type: 'h2', text: 'Learn the four families' },
      { type: 'p', text: 'Almost every fragrance falls into one of four broad families, sometimes blending two.' },
      {
        type: 'ul',
        items: [
          'Fresh / citrus — bergamot, grapefruit, sea salt, green notes. Light, short-lived, best for daytime and warm weather.',
          'Floral — rose, jasmine, iris, peony. Ranges from powdery and quiet to loud and heady depending on which flower leads.',
          'Woody / amber — sandalwood, cedar, vetiver, amber. Warm, longer-lasting, works across seasons.',
          'Oriental / spiced — cinnamon, saffron, incense, tobacco. Bold, best in cold weather, tends to project further.',
        ],
      },
      {
        type: 'p',
        text: 'Most fragrances sit at an intersection — a woody floral, a spiced amber — rather than purely in one box. Once you know which two or three words describe what you like, you can skip most of a counter on sight.',
      },
      { type: 'h2', text: 'Read the note pyramid before you read the marketing' },
      {
        type: 'p',
        text: "Every fragrance is built in three layers: top notes (the first ten minutes), heart notes (the next few hours), and base notes (what's left once the top and heart have faded, often the longest-lasting part). Marketing copy talks about mood. The note pyramid tells you what you'll actually smell, and when. If you only ever smell a fragrance for thirty seconds in a shop, you're judging notes that might be gone before you've left the building.",
      },
      { type: 'h2', text: 'Test on skin, never on paper alone' },
      {
        type: 'p',
        text: "Paper is useful for a first pass — it lets you rule things out fast without wearing five conflicting scents at once. But skin chemistry changes almost everything about how a fragrance develops: pH, warmth, even diet shift how notes read on you specifically. A fragrance that smells thin on paper can bloom on skin, and one that smells rich on paper can go flat. Test finalists on the inside of your wrist or forearm, not just on a card.",
      },
      { type: 'h2', text: 'Give it twenty minutes before you decide anything' },
      {
        type: 'p',
        text: "The biggest mistake in choosing a fragrance is deciding in the first sixty seconds. Top notes are built to be immediately attractive, and they can oversell a fragrance that has nothing interesting to say once they fade. Wait at least twenty minutes — long enough for the top to clear and the heart to show itself — before forming an opinion. If you can, wait two to three hours to meet the base as well.",
      },
      { type: 'h2', text: 'Match the fragrance to how you actually live' },
      {
        type: 'p',
        text: "It's tempting to buy one bottle for \"everyday\" and one for \"special occasions.\" In practice, most people wear whatever's on their desk regardless of the day. Better to ask: what's the temperature where you live most of the year? Do you spend most of your time indoors or outside? Do you sit close to other people all day, or at a distance? A fragrance with strong, far-reaching sillage is wasted in a small office and can become a problem in a lift. An intimate, close-to-skin fragrance disappears outdoors in summer heat. Buy for your actual week, not an imagined one.",
      },
      { type: 'h2', text: 'Test on skin before you commit to a full bottle' },
      {
        type: 'p',
        text: "A 50ml bottle is a real commitment, and no amount of reading substitutes for wearing something on your own skin for a full day. Where you can, test on your wrist in-store and let it run its full course before buying, rather than judging from the first sixty seconds at a counter.",
      },
    ],
    faq: [
      {
        q: 'How many fragrances should I own at once?',
        a: "There's no fixed number. Most people are well served by two or three in active rotation — one for daytime and cooler weather, one for evening or warmer weather, and one worn out of habit. More than that becomes a collection rather than a wardrobe, which is its own hobby and not a requirement.",
      },
      {
        q: 'Does a more expensive perfume last longer?',
        a: 'Not reliably. Longevity depends more on concentration and the specific notes used — base notes like oud, amber and musk last far longer than citrus or light florals — than on price. See our guide to eau de parfum versus eau de toilette for the difference in concentration.',
      },
      {
        q: 'Can I tell how a fragrance will smell on me from how it smells on someone else?',
        a: "Only roughly. Skin chemistry varies enough that the same fragrance can read differently between people, especially in how quickly it fades and how the base notes come through. Use someone else's experience as a starting point, not a guarantee.",
      },
    ],
  },
  {
    slug: 'eau-de-parfum-vs-eau-de-toilette',
    title: 'Eau de Parfum vs Eau de Toilette',
    metaTitle: 'Eau de Parfum vs Eau de Toilette: The Real Difference | IKARIS',
    metaDescription:
      'Eau de parfum and eau de toilette differ by one number: concentration. Here is what that changes about longevity, sillage, and which one to buy.',
    datePublished: '2026-02-12',
    dateModified: '2026-02-12',
    blocks: [
      {
        type: 'p',
        text: 'The difference between eau de parfum (EDP) and eau de toilette (EDT) comes down to one number: how much perfume oil is dissolved in the alcohol base. Everything else — how long it lasts, how far it projects, even how much it costs — follows from that one ratio.',
      },
      { type: 'h2', text: 'The concentration ladder' },
      { type: 'p', text: 'Fragrance strength is measured by the percentage of aromatic compound in the bottle, from lightest to strongest.' },
      {
        type: 'ul',
        items: [
          'Eau fraiche — roughly 1-3% concentration',
          'Eau de cologne (EDC) — roughly 2-5%',
          'Eau de toilette (EDT) — roughly 5-15%',
          'Eau de parfum (EDP) — roughly 15-20%',
          'Parfum / extrait — roughly 20-30%',
        ],
      },
      {
        type: 'p',
        text: "These ranges vary by house and aren't tightly regulated, so two EDPs from different brands can differ noticeably in strength. But as a rule, EDP will always run stronger than EDT within the same fragrance line.",
      },
      { type: 'h2', text: 'What that actually changes' },
      {
        type: 'p',
        text: 'A higher concentration means three things, and only three: it lasts longer on skin, it projects further from the body, and it costs more to produce because more of the aromatic oil goes into every bottle. It does not mean the fragrance is "better" — an EDT of a fragrance you love and wear lightly can be the more sensible choice than an EDP of the same scent you would otherwise oversaturate.',
      },
      { type: 'h2', text: 'Longevity: what to actually expect' },
      {
        type: 'p',
        text: 'An EDT typically lasts four to six hours on skin before fading to nothing. An EDP typically lasts six to ten hours, sometimes longer depending on the base notes — heavy, resinous bases like oud, amber and vetiver extend wear time regardless of concentration, because they evaporate more slowly than citrus or light florals. An EDP built on grapefruit and sea salt might not outlast an EDT built on incense and leather. Concentration is one variable, not the only one.',
      },
      { type: 'h2', text: 'Sillage: the trail a fragrance leaves' },
      {
        type: 'p',
        text: 'Sillage — French for "wake," as in the wake a boat leaves — describes how far a fragrance projects and how noticeable it is to people around you. EDP generally has stronger sillage than EDT of the same fragrance, simply because more aromatic material is evaporating off the skin at once. This matters more than longevity in shared spaces: a fragrance can last eight hours and stay perfectly polite if its sillage is intimate, while a fragrance with strong sillage can feel like too much within an hour in a small meeting room.',
      },
      { type: 'h2', text: 'Which one should you buy?' },
      {
        type: 'p',
        text: "If you're trying a fragrance for the first time, or you wear scent mainly for yourself rather than to be noticed, EDT is often the more practical choice — lighter, easier to reapply, harder to overdo. If you want a fragrance to last through a full day without reapplication, or you like a stronger presence, EDP is worth the extra cost. Climate matters too: in heat, both concentration and sillage read stronger than they would in cold air, so a fragrance that feels right in an air-conditioned office can feel like too much outdoors in summer.",
      },
      { type: 'h2', text: 'Does concentration change how a fragrance smells, not just how strong it is?' },
      {
        type: 'p',
        text: 'Slightly. Because EDP carries proportionally less alcohol and more oil, the top notes can feel a touch rounder and less sharp than the same fragrance in EDT, where the higher alcohol content makes the opening feel crisper and fade faster. It is a small difference, and most people notice longevity and sillage far more than any shift in character.',
      },
    ],
    faq: [
      {
        q: 'Is eau de parfum always better value than eau de toilette?',
        a: 'Not necessarily. EDP costs more per bottle but lasts longer per spray, so cost-per-wear can work out similar. If you tend to reapply throughout the day regardless of concentration, EDT can be the better value.',
      },
      {
        q: 'Why do some fragrances only come in EDT, and others only in EDP?',
        a: 'A house builds a fragrance around a specific concentration during development, and the notes are balanced for that strength. Producing the same formula at a different concentration would change the balance, so many fragrances are released in only one strength. All six IKARIS fragrances are formulated and sold as eau de parfum only.',
      },
    ],
  },
  {
    slug: 'how-to-make-perfume-last-longer',
    title: 'How to Make Perfume Last Longer',
    metaTitle: 'How to Make Perfume Last Longer, According to Chemistry | IKARIS',
    metaDescription:
      'Most complaints about perfume fading are about application, not the fragrance. Moisturise, target pulse points, and store it right. Here is how.',
    datePublished: '2026-02-14',
    dateModified: '2026-02-14',
    blocks: [
      {
        type: 'p',
        text: 'Most complaints about a fragrance "not lasting" are not really about the fragrance at all — they are about how and where it was applied. The chemistry of scent fading is mostly fixed, but a handful of habits noticeably extend how long a fragrance stays perceptible, both to you and to people near you.',
      },
      { type: 'h2', text: 'Moisturise before you spray' },
      {
        type: 'p',
        text: 'Fragrance clings to moisture. Dry skin absorbs and disperses aromatic oils faster than skin with a layer of unscented lotion or petroleum jelly on it. Apply an unscented moisturiser to pulse points a few minutes before spraying, and the same amount of perfume will read for noticeably longer. This matters more in dry climates and air-conditioned rooms than in humid ones.',
      },
      { type: 'h2', text: 'Target pulse points, not clothing' },
      {
        type: 'p',
        text: "Pulse points — wrists, the base of the throat, behind the ears, inside the elbows — run warmer than the rest of the body, and that warmth releases fragrance steadily throughout the day rather than all at once. Spraying onto clothing instead of skin can make a fragrance last physically longer on the fabric, but it changes how it develops: fabric does not have the same warmth or oils that skin does, so notes can smell flatter and take longer to open up.",
      },
      { type: 'h2', text: "Don't rub your wrists together" },
      {
        type: 'p',
        text: 'Rubbing wrists together after spraying feels intuitive but works against the fragrance. Friction generates heat, and heat breaks down the top notes faster, meaning you lose the opening phase early and can distort how the heart notes eventually present. Spray and let it dry undisturbed.',
      },
      { type: 'h2', text: 'Layer with an unscented or matching base' },
      {
        type: 'p',
        text: 'A fragrance applied to bare, unmoisturised skin in a hot climate can burn off within two or three hours. Layering — an unscented body lotion first, or a matching product from the same fragrance line where available — gives the scent something to hold onto and extends wear meaningfully. This is the single most effective change most people can make.',
      },
      { type: 'h2', text: 'Store it properly' },
      {
        type: 'p',
        text: 'Heat, light and air are the three things that degrade a fragrance in the bottle before it even reaches your skin. A bottle kept on a sunlit windowsill or in a hot bathroom will oxidise faster than one kept in a cool, dark drawer, and an oxidised fragrance smells noticeably different — flatter, sometimes sourer — than a fresh one. Keep bottles upright, away from direct light, and away from bathroom humidity and temperature swings if you can.',
      },
      { type: 'h2', text: 'Reapply with intention, not habit' },
      {
        type: 'p',
        text: 'If a fragrance has faded by early afternoon, a single reapplication to a pulse point or two is more effective than a full second application across the body. Fragrance is not linear — doubling the amount does not double how long it lasts, and overlapping a faded base with a fresh top note can smell muddled rather than simply "more."',
      },
      { type: 'h2', text: 'Know which notes were always going to fade first' },
      {
        type: 'p',
        html: 'Some fading is not a storage or application problem at all — it is the structure of the fragrance. Citrus, light florals and green notes are inherently volatile and evaporate within the first one to two hours by design; they are top notes precisely because they are meant to introduce a fragrance, not carry it. If you want a fragrance that reads consistently for eight hours or more, look at the base notes before you buy: heavy resins, woods and musks last far longer on skin than a fragrance built mostly on citrus and green top notes. See our guide to <a href="/guides/fragrance-notes-explained/">fragrance notes explained</a> for how the three layers work.',
      },
    ],
    faq: [
      {
        q: 'Does spraying more perfume make it last longer?',
        a: 'Only marginally, and it comes at the cost of overwhelming sillage in the first hour. A better approach is targeted reapplication later in the day rather than a heavier initial application.',
      },
      {
        q: 'Why does the same perfume seem to fade faster in summer than in winter?',
        a: 'Heat speeds up evaporation, so top and heart notes burn through faster in warm weather, and sweat can interact with a fragrance in ways that change how it smells. In colder, drier air, the same fragrance both lasts longer and projects less, because there is less ambient heat pulling it off the skin.',
      },
    ],
  },
  {
    slug: 'fragrance-notes-explained',
    title: 'Fragrance Notes Explained',
    metaTitle: 'Fragrance Notes Explained: Top, Heart, and Base | IKARIS',
    metaDescription:
      "A fragrance isn't a list of ingredients, it's a timeline. Here is how top, heart, and base notes work, and how to read a note list correctly.",
    datePublished: '2026-02-16',
    dateModified: '2026-02-16',
    blocks: [
      {
        type: 'p',
        text: '"Notes" is the word the fragrance industry uses for individual scents — bergamot, rose, oud, vanilla — but a finished fragrance is not just a list of them. It is a structure, built in three layers that reveal themselves over time. Understanding that structure is the difference between reading a label and understanding what you will actually experience wearing it.',
      },
      { type: 'h2', text: 'The pyramid: top, heart, base' },
      {
        type: 'p',
        text: 'Perfumers describe a fragrance as a pyramid because each layer sits on top of the one beneath it, and each fades at a different rate to reveal the next.',
      },
      {
        type: 'ul',
        items: [
          'Top notes (0-15 minutes) — the first impression. Light, volatile molecules: citrus, light fruits, certain herbs. Built to attract attention immediately, then get out of the way.',
          'Heart notes (15 minutes to 2-3 hours) — the body of the fragrance. Florals, spices, and mid-weight woods. This is what most people mean when they describe "how a fragrance smells," since it is present for the longest visible stretch.',
          'Base notes (2-3 hours onward) — the foundation. Heavy, slow-evaporating materials: woods, resins, musks, amber. These often last the longest and are why a fragrance can still be perceptible on skin or clothing the next day.',
        ],
      },
      { type: 'h2', text: 'Why the layers fade at different speeds' },
      {
        type: 'p',
        text: 'Molecular weight is most of the answer. Top note materials are small, light molecules that evaporate quickly at skin temperature. Base note materials — oud, sandalwood, amber, musk — are larger, heavier molecules that resist evaporation and can take hours to fully release their scent. This is not a design choice so much as chemistry: perfumers select materials for each layer partly because of how fast they naturally evaporate, then balance the composition so the transitions feel deliberate rather than abrupt.',
      },
      { type: 'h2', text: 'Reading a note list correctly' },
      {
        type: 'p',
        text: 'A note list is usually presented top to heart to base, but it is worth reading it as a timeline rather than a single flat description. A fragrance listed with bergamot, black tea, oud is not three simultaneous smells — it is bergamot for the first few minutes, black tea for the next few hours, and oud emerging last and staying longest. If you only smell a fragrance briefly in a shop, you may never meet the base notes at all, which is often the part that determines whether you would actually enjoy wearing it for a full day.',
      },
      { type: 'h2', text: 'Common note families and what they signal' },
      {
        type: 'ul',
        items: [
          'Citrus (bergamot, grapefruit, mandarin) — bright, short-lived, signals freshness and energy. Almost always a top note.',
          'Floral (rose, jasmine, iris, peony, tuberose) — the largest and most varied family. Can appear at any layer depending on the specific flower and how it is extracted.',
          'Woody (sandalwood, cedar, vetiver) — warm, dry, grounding. Common in the base, sometimes the heart.',
          'Resinous / amber (labdanum, benzoin, amber) — warm, sweet-adjacent without being sugary, almost always a base note and a major contributor to longevity.',
          'Musk — soft, close to skin, used across all three layers but most influential in the base, where it acts as a fixative holding other materials to the skin longer.',
          'Spice (cardamom, saffron, black pepper, cinnamon) — sits in the top or heart, adds warmth and presence without necessarily adding sweetness.',
        ],
      },
      { type: 'h2', text: 'What "accord" means' },
      {
        type: 'p',
        text: 'An accord is a blend of several individual materials combined to produce a single, cohesive effect that reads as one thing rather than several — a "leather accord," for instance, is rarely made from anything that smells like leather on its own, but from a specific combination of materials that together suggest it. When a note list includes something like "mineral accord" rather than a single named ingredient, it means the perfumer built that effect from a blend rather than reaching for one raw material.',
      },
      { type: 'h2', text: 'Why the same notes can smell different across two fragrances' },
      {
        type: 'p',
        text: 'Two fragrances can share an identical note list and still smell completely different, because the note list only tells you the ingredients, not the proportions, the quality of each material, or how they are layered against each other. This is also why skin chemistry matters: how quickly your skin releases each layer, and how your skin\'s own pH and oils interact with base notes especially, can shift how the same fragrance reads from one person to the next.',
      },
    ],
    faq: [
      {
        q: 'Do all fragrances follow the top-heart-base structure?',
        a: 'Most do, though the boundaries are softer than the pyramid diagram suggests, and some modern, simpler compositions use only two visible phases rather than three distinct ones. Nearly all fragrances still fade in some order rather than presenting everything at once.',
      },
      {
        q: 'Which layer should I care about most when choosing a fragrance?',
        a: 'The base, if you are buying for longevity, since it is what remains after the first few hours and largely determines the character of the fragrance for the rest of the day. See our guide on how to choose a perfume for a fuller approach.',
      },
    ],
  },
];

module.exports = { GUIDES };
