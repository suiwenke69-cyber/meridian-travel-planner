import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Build notes',
  description:
    'How Meridian was built: stack decisions, the basemap problem, the bugs testing caught, and what is deliberately missing.',
};

/**
 * A static build dossier.
 *
 * Deliberately NOT linked from the product UI — it exists so the engineering
 * record is readable in a browser and fetchable as raw text by an analyst or an
 * LLM. The product itself stays a product.
 */
const SCREENSHOTS: Array<{ file: string; title: string; body: string }> = [
  {
    file: '01-home-desktop.jpg',
    title: 'Southeast Asia overview',
    body: 'Singapore is a bespoke accent star. Destinations are native map layers — a small dot plus a label — not floating pins, so they collide and fade like the cartography around them. The permanent legend and all data disclaimers were removed.',
  },
  {
    file: '02-home-hover.jpg',
    title: 'Hover reveals travel metadata',
    body: 'Hovering a destination row highlights its marker; hovering a marker highlights its row. The label gains the typical block time and whether the route is direct.',
  },
  {
    file: '03-home-selected.jpg',
    title: 'Selection stays on the map',
    body: 'Choosing a destination draws exactly one arc from Singapore — never a web of lines — and opens a compact preview. Comparing options is a spatial task, so nothing navigates away.',
  },
  {
    file: '04-planner-setup.jpg',
    title: 'Destination planner, trip setup',
    body: 'Dates first, because dates generate the days that every hotel and activity is added to. This is Bali at overview zoom, framed to the island rather than the whole dataset.',
  },
  {
    file: '05-planner-itinerary.jpg',
    title: 'The itinerary is built around the map',
    body: 'Stops are numbered on the map in the same order they appear in the day. Reordering works by drag and by accessible move up/down controls.',
  },
  {
    file: '06-planner-route.jpg',
    title: 'Real road geometry',
    body: 'Routing runs through OSRM, so the line follows roads and the distances are road distances. If the routing provider is unreachable the line becomes dashed and the UI says so.',
  },
  {
    file: '07-planner-efficiency.jpg',
    title: 'Route efficiency',
    body: 'Geometry-driven observations the user can act on: long transfers, spread-out days, backtracking, hotel/activity mismatch. Every message quotes the number it is based on, and none of them claim to know opening hours.',
  },
  {
    file: '08-map-markers.jpg',
    title: 'Marker system',
    body: 'Category markers carry a shape, a glyph and a label — never colour alone. Marriott is a rounded square with an M, Hilton a circle with an H. Clusters are styled to belong to the map.',
  },
  {
    file: '20-explore.jpg',
    title: 'EXPLORE — understanding Bali first',
    body: 'The destination opens on EXPLORE at whole-island scale, not on a trip form. Each travel zone is drawn from that area\'s own mapped hotels and places — a hull of the content, padded and smoothed — so Canggu reads as a coastal strip and Uluwatu as a cliff line instead of a radius circle. The fine dashed edge is the cartographic signal for "approximate", and the zones are drawn beneath the basemap\'s water layer so they never float out to sea. The map draws one scope at a time: nine stay bases, or six day-trip zones.',
  },
  {
    file: '21-area-detail.jpg',
    title: 'An area, in depth',
    body: 'Selecting a region frames the map on it and opens a visual card: hero photograph with credit, what it is best for and less ideal for, the airport transfer, and how many hotels and places are there.',
  },
  {
    file: '22-stay.jpg',
    title: 'STAY — hotels as properties, not rows',
    body: 'The camera moves to where the hotels are, so all 20 markers are individual and Marriott (rounded square, M) is distinguishable from Hilton (circle, H). Properties with photography come first, because a first screen of empty placeholders is a poor introduction to Bali.',
  },
  {
    file: '23b-hotel-detail.jpg',
    title: 'A hotel, in depth',
    body: 'Every photograph is labelled with what it actually shows — BEACH, POOL, ROOM — so a gallery shot is never mistaken for the property itself, and every image carries its author, licence and source. Fourteen of twenty Bali hotels have no verifiable property photography at all; those cards say "No property photography available" rather than borrowing the area’s beach photo and implying a beach is the hotel.',
  },
  {
    file: '23-do.jpg',
    title: 'DO — one category at a time',
    body: 'The map draws only the selected category. This is the fix for the previous build’s marker overload: beaches, nature, culture, food, nightlife and water activities each own their own view. A place with no photograph gets a compact text-led card rather than an empty box the size of the photograph it is standing in for.',
  },
  {
    file: '24-plan-transport.jpg',
    title: 'PLAN — places and the transport between them',
    body: 'Every consecutive pair of stops becomes a first-class leg: mode, estimated duration and measured distance on one line, then the reasoning, then a badge naming the routing engine that produced the numbers. Distances and durations come from OSRM and are labelled as free-flow estimates because traffic is not modelled; a leg with no routing data says "No route data" and marks the whole day’s clock as approximate instead of inventing a duration.',
  },
  {
    file: '25-route.jpg',
    title: 'The route is real road geometry',
    body: 'The map draws the same day the itinerary describes, following roads rather than straight lines, with stops numbered in order.',
  },
  {
    file: '26-mobile-explore.jpg',
    title: 'Mobile EXPLORE',
    body: 'The map keeps the top of the screen and the region labels stay legible; the explorer sits in a snap sheet below.',
  },
  {
    file: '27-mobile-stay.jpg',
    title: 'Mobile STAY',
    body: 'Hotel photography remains usable on a phone without taking over the screen.',
  },
  {
    file: '09-mobile-home.jpg',
    title: 'Mobile keeps the map',
    body: 'The bottom sheet starts collapsed so the map owns the screen, with the search field visible as the invitation to explore. The map refits when the sheet changes size.',
  },
  {
    file: '10-mobile-selected.jpg',
    title: 'Selection on mobile',
    body: 'The arc and both endpoints stay visible above the sheet. Expanding the sheet does not bury the destination, because the fit accounts for the sheet height.',
  },
];

const STACK = [
  ['Framework', 'Next.js 15 App Router, React 19, TypeScript'],
  ['Map', 'MapLibre GL JS over free vector tiles; style authored in-repo'],
  ['Tiles', 'CARTO vector tiles, with OpenFreeMap as an automatic fallback'],
  ['Routing', 'OSRM road geometry, with a documented geodesic estimator as fallback'],
  ['State', 'Zustand + localStorage, manual hydration'],
  ['Styling', 'Tailwind with CSS custom properties as design tokens'],
  ['Runtime dependencies', 'maplibre-gl, next, react, react-dom, zustand — five'],
];

const DECISIONS: Array<[string, string]> = [
  [
    'Author our own basemap style',
    'Raster tiles bake their labels into pixels, so no CSS can make them calmer. Loading a vendor style JSON at runtime would hand control of label density to someone else and could start watermarking without warning. The tiles are the vendor’s; the cartography is ours.',
  ],
  [
    'No prices, anywhere',
    'There is no pricing source in V1. Hotel cost is a brand-positioning tier and the basis is printed on every card. Provider adapters for Amadeus and a Skyscanner-compatible API exist and are inert without credentials.',
  ],
  [
    'Selection never leaves the map',
    'Comparison is spatial. Navigating to a detail page to read a flight time destroys the thing the product is for.',
  ],
  [
    'Adding a place does not switch panels',
    'Adding three stops while browsing a list should not yank the user out of the list. The button flips to “Added to Day N” and the map gains a numbered marker.',
  ],
  [
    'Honest confidence on every coordinate',
    'Each record carries verified / approximate / demo plus a note describing what the point marks. 5 of 119 places are approximate and are drawn with a visible badge.',
  ],
  [
    'Area boundaries are dashed circles',
    'Real administrative polygons were not available. A dash pattern and an “approximate extent” tooltip say so, rather than drawing a guess as if it were official.',
  ],
];

const BUGS: Array<[string, string]> = [
  [
    'A destination sat off-screen',
    'A hard-coded region bounding box had drifted out of date and excluded Bali. Bounds are now derived from the data, so adding a destination cannot reproduce the bug.',
  ],
  [
    'Blank map, no error',
    'MapLibre resolves its web worker at runtime through import.meta.url, which a bundler cannot follow. A prebuild script now vendors the worker and fails loudly if a future version moves it.',
  ],
  [
    'A grey veil over the planning map',
    'A 3.5% fill on inactive areas compounded across ten or more overlapping areas into a flat grey wash. Isolating it required an A/B render and pixel sampling, because the cause was invisible by inspection. Inactive areas are now outline-only.',
  ],
  [
    'Markers floated above the UI',
    'Marker z-index values escaped the map’s stacking context and competed with page chrome, so a map marker rendered on top of the mobile bottom sheet.',
  ],
  [
    'The origin was pushed off the phone screen',
    'A minimum zoom of 4 clamped the mobile fit on a narrow viewport. The floor has to sit below the fitted zoom for the smallest screen.',
  ],
  [
    'Area labels repeated five times',
    'Labels placed from large polygons let the placement engine find several valid positions inside one shape. They now come from a one-point-per-area source.',
  ],
];

export default function ProcessPage() {
  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-[880px] px-5 py-12 sm:px-8 sm:py-16">
        <header className="border-b border-line pb-8">
          <p className="label-caps">Build notes</p>
          <h1 className="mt-3 text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[42px]">
            Meridian
          </h1>
          <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-ink-soft">
            A map-first Southeast Asia travel planner for travellers departing from Singapore. V1 is
            working end to end and holds no live data — deliberately.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/" className="btn-primary btn-xs">
              Open the product
            </Link>
            <Link href="/destination/bali" className="btn-secondary btn-xs">
              Bali destination experience
            </Link>
            <a href="/docs/PROCESS.md" className="btn-secondary btn-xs">
              PROCESS.md
            </a>
            <a href="/docs/README.md" className="btn-secondary btn-xs">
              README.md
            </a>
            <a href="/docs/ROADMAP.md" className="btn-secondary btn-xs">
              ROADMAP.md
            </a>
            <a href="/docs/project.json" className="btn-secondary btn-xs">
              project.json
            </a>
          </div>
        </header>

        <Section title="The thesis">
          <p>
            The product is not a website containing Southeast Asia travel information. It is an
            interactive geographic decision-making tool: where to go, where to stay, what to do, and
            how to arrange those places into a trip that makes geographic sense. The map is the
            product; the itinerary is built around the map.
          </p>
          <p>
            Every design review question reduces to one: <em>does this help the traveller understand
            where things are?</em> That is why there is no hero banner, no list-first layout, and no
            price grid.
          </p>
        </Section>

        <Section title="Screens">
          <p>
            The first ten screens are the Southeast Asia homepage and the original planner. The
            later screens are the rebuilt destination experience: EXPLORE → STAY → DO → PLAN.
          </p>
          <div className="space-y-10">
            {SCREENSHOTS.map((shot) => (
              <figure key={shot.file}>
                <div className="overflow-hidden rounded-card border border-line bg-surface-warm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/docs/screenshots/${shot.file}`}
                    alt={shot.title}
                    loading="lazy"
                    className="block w-full"
                  />
                </div>
                <figcaption className="mt-3">
                  <p className="text-[13.5px] font-semibold text-ink">{shot.title}</p>
                  <p className="mt-1 max-w-[68ch] text-[13px] leading-relaxed text-muted">{shot.body}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>

        <Section title="Stack">
          <dl className="divide-y divide-line overflow-hidden rounded-card border border-line">
            {STACK.map(([key, value]) => (
              <div key={key} className="grid gap-1 px-4 py-3 sm:grid-cols-[190px_1fr] sm:gap-4">
                <dt className="label-caps pt-0.5">{key}</dt>
                <dd className="text-[13.5px] leading-relaxed text-ink-soft">{value}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="Imagery">
          <p>
            Photography is a provider layer, not scattered URLs. Components ask for images by entity
            and receive structured records carrying the licence, the author and — critically — what
            the photo actually depicts.
          </p>
          <p>
            Source: <strong>Wikimedia Commons</strong>. Free by policy, machine-queryable, and it
            returns licence and author with every file, so the UI can render a real credit line.
            Eighty subjects were resolved by <code>scripts/fetch-bali-images.mjs</code>, which scores
            candidates on subject-token overlap, aspect ratio and resolution, rejects known-bad
            matches, and commits a reproducible manifest.
          </p>
          <p>
            Commons has almost no hotel photography for Bali. <strong>Three properties have genuine
            photos of themselves and the other seventeen borrow their area image</strong>, which the
            card discloses as “Area photo — not this specific property”. Rejecting bad matches
            mattered: the first pass picked a bird for a Hilton Garden Inn, a competitor’s resort for
            a Renaissance, and a fashion shoot for the Ritz-Carlton.
          </p>
          <p className="text-muted">
            No image, a failed image and a representative image each have a designed treatment. The
            test suite forces every image on the page to fail and asserts the page survives.
          </p>
        </Section>

        <Section title="Transport">
          <p>
            A transport leg is a first-class itinerary item, not a connector line. It carries mode,
            rationale, alternatives, distance, duration, geometry, source and confidence.
          </p>
          <p>
            <strong>Routing and recommendation are separate.</strong> The routing layer answers how
            far and how long by road — OSRM by default, free and keyless, with server-only adapters
            for OpenRouteService, Mapbox Directions and Google Routes behind an API route so keys
            never reach the browser. The recommendation layer answers what the traveller should
            actually do, and states its reasoning in the interface.
          </p>
          <p>
            <strong>Nothing is fabricated.</strong> A route result cannot carry a number unless a
            provider produced one, so the UI cannot print an invented duration by accident. When no
            engine answers, the leg reads “Route unavailable” and shows only the straight-line
            distance, explicitly labelled as not a driving distance.
          </p>
          <p className="text-muted">
            Water crossings are modelled as data, so Ubud → Nusa Penida renders as a two-mode leg —
            car to Sanur Harbour, then a fast boat. Full multimodal routing is deliberately not
            attempted in V1.
          </p>
        </Section>

        <Section title="Decisions worth arguing about">
          <ul className="space-y-4">
            {DECISIONS.map(([title, body]) => (
              <li key={title}>
                <p className="text-[13.5px] font-semibold text-ink">{title}</p>
                <p className="mt-1 max-w-[72ch] text-[13px] leading-relaxed text-ink-soft">{body}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="What testing actually caught">
          <ul className="space-y-4">
            {BUGS.map(([title, body]) => (
              <li key={title}>
                <p className="text-[13.5px] font-semibold text-ink">{title}</p>
                <p className="mt-1 max-w-[72ch] text-[13px] leading-relaxed text-ink-soft">{body}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Data">
          <p>
            Ten destinations, 48 areas, 43 Marriott Bonvoy and Hilton Honors hotels and 119 places.
            Coordinates were verified against Wikidata, the Wikipedia coordinates API and
            OpenStreetMap element ids, and every record keeps its source.
          </p>
          <p>
            That pass caught six errors that would otherwise have shipped: a DoubleTree in Bali that
            does not exist; Siem Reap&rsquo;s airport still listed under its closed 2023 code; Phnom
            Penh&rsquo;s airport code superseded in 2025; El Nido&rsquo;s code wrong; a Méridien in
            Siem Reap that has closed while the brand&rsquo;s pages stay live; and a Palawan hotel
            filed in the wrong town.
          </p>
          <p className="text-muted">
            No prices anywhere. Hotel cost is a brand-positioning tier, and the basis is shown.
          </p>
        </Section>

        <Section title="Verification">
          <p>
            A Playwright-driven end-to-end suite exercises the whole workflow against a real browser
            and fails on any console error, page error or failed request.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['67 / 67', 'checks passing'],
              ['0', 'console errors'],
              ['0', 'page errors'],
              ['70 / 70', 'checks passing'],
            ['5', 'runtime deps'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-card border border-line bg-surface px-3 py-2.5">
                <p className="text-[19px] font-semibold tabular-nums leading-none text-ink">{value}</p>
                <p className="mt-1.5 text-[11.5px] leading-tight text-muted">{label}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="What is deliberately missing">
          <ul className="list-disc space-y-2 pl-5 text-[13px] leading-relaxed text-ink-soft">
            <li>No prices at all — no fares, no nightly rates, no availability.</li>
            <li>No backend and no accounts; trips live in localStorage on one browser.</li>
            <li>Only Bali is deep. The other nine destinations demonstrate the architecture.</li>
            <li>Destination labels can collide at overview zoom; hovering always reveals them.</li>
            <li>Traffic is not modelled, so drive times are normal-traffic estimates.</li>
            <li>Area shapes are radius circles, not real administrative boundaries.</li>
            <li>No photography yet.</li>
          </ul>
        </Section>

        <footer className="mt-14 border-t border-line pt-6">
          <p className="text-[12px] leading-relaxed text-muted">
            Raw documents for machine reading:{' '}
            <a className="underline decoration-line-strong underline-offset-2" href="/docs/PROCESS.md">
              /docs/PROCESS.md
            </a>
            ,{' '}
            <a className="underline decoration-line-strong underline-offset-2" href="/docs/README.md">
              /docs/README.md
            </a>
            ,{' '}
            <a className="underline decoration-line-strong underline-offset-2" href="/docs/ROADMAP.md">
              /docs/ROADMAP.md
            </a>
            ,{' '}
            <a className="underline decoration-line-strong underline-offset-2" href="/docs/project.json">
              /docs/project.json
            </a>
            .
          </p>
        </footer>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12 border-t border-line pt-8">
      <h2 className="text-[19px] font-semibold tracking-[-0.01em]">{title}</h2>
      <div className="mt-4 space-y-3 text-[13.5px] leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}
