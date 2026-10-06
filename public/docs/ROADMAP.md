# Roadmap

The north star: an interactive geographic decision-making tool that helps Singapore-based
travellers decide **where to go, where to stay, what to do, and how to arrange those places into an
efficient trip**. The map is the product; the itinerary is built around the map.

Anything on this roadmap is judged against one question: *does this help the traveller understand
where things are?*

---

## V1 — shipped

**The full loop works end to end, with no live data and no invented numbers.**

### Map foundation
- **MapLibre GL + vector tiles, no API key and no cost.** The basemap style is authored in
  `components/map/basemap-style.ts` over CARTO's keyless vector tiles, with OpenFreeMap as an
  automatic fallback. Raster tiles bake their labels into pixels; vector tiles let us cut the label
  set down to country → region → city → town, in English, in our own palette.
- Map engine isolated from product logic: one component owns MapLibre, overlays are independent, and
  the engine never reaches the server bundle. Swapping engines did not touch the data layer.
- Dependency-free grid clustering in projected pixel space, stable across panning.
- Distinct marker system: shape **and** glyph **and** label, never colour alone. Marriott = rounded
  square with an `M`, Hilton = circle with an `H`, airport = ringed plane, plus one silhouette per
  place category.
- Homepage destinations drawn as **native map layers** (dot + label, three states) rather than
  floating pins, so they collide and fade like the cartography around them.

### Southeast Asia overview
- Singapore as a first-class `Home / Origin` with a bespoke accent star. It is the only DOM marker
  on the page.
- 10 destinations across Indonesia, Vietnam, Cambodia and the Philippines, framed by bounds derived
  from the data. No arc is drawn until a destination is chosen, and then exactly one.
- Destination preview in place: flight time, non-stop status, ideal stay, what it is good for, and
  the loyalty inventory. The map is never left behind.
- Destination rail that reads like a travel guide rather than a database: *Bali / Indonesia ·
  4–7 days / ≈2h 45m / Direct*.

### Destination experience (redesigned)
- **EXPLORE / STAY / DO / PLAN**, in the order a traveller actually takes them. The destination
  opens on EXPLORE, not on a trip form.
- Each tab re-frames the map for its own question, so the camera is part of the navigation.
- Six headline regions with authored taglines, photography and structured best-for / less-ideal-for
  metadata, labelled directly on the map.
- Marriott and Hilton hotels as visual cards; place cards with photography and one category at a
  time so the map never becomes marker soup.
- Desktop map-first with a contextual right rail; mobile converts the rail into a three-snap sheet.

### Photography
- Provider-based image architecture (`lib/images/`): components ask for images by
  `(entityKind, entityId)` and never hold a URL. Licence, author, source page and a `subject`
  field ship with every image and render on the card and the detail view.
- **134 images across 60 subjects**, resolved from Wikimedia Commons and Openverse, restricted to
  commercial-use licences (CC BY, CC BY-SA, CC0, public domain). No NC, no ND.
- **A hotel photo is only used if it is provably of that property** — the file title must name the
  property *and* the right part of Bali, or the file must sit in the property's own Commons
  category. Four of twenty Bali hotels clear that bar; the other sixteen have no entry at all and
  say **"No property photography available"**. They never borrow their area's beach photograph, and
  a photograph of the resort's name on a wall does not count as property photography.
- Every candidate is fetched before it is written into the manifest, so a source that has since
  been deleted is dropped rather than shipped as a broken image.
- Designed fallbacks for no image, a failed image and a representative image — and a compact
  text-led card, rather than an empty photograph-sized hole, when there is no photo at all.

### Transport
- `TransportLeg` as a first-class itinerary item with mode, rationale, alternatives, distance,
  duration, geometry, source and confidence.
- `RoutingProvider` abstraction: OSRM by default, with server-only OpenRouteService / Mapbox /
  Google adapters behind `/api/route`.
- Recommendation kept separate from routing; water crossings modelled as data for future
  multimodal support.
- Nothing fabricated: an unanswered route renders as "Route unavailable", never as an estimate.
- **Transport legs are first-class in PLAN**: `mode · estimated duration · distance`, then the
  rationale, then a source badge naming the routing engine — or saying **No route data**. Where any
  leg is unmeasured the whole day's clock is marked `approx`. Traffic is not modelled and each
  measured leg is labelled a free-flow estimate.
- Layers: Marriott, Hilton, Activities, Nature, Beaches, Food, Nightlife, Airport, Transport —
  each with a live count.
- Filters: hotel group, price tier, travel style, place category, free-text search. The legend and
  the marker set are produced by the same function, so they cannot disagree.
- Where-to-stay panel with per-area scores, best-for / weak-for, loyalty inventory and price tier.
- **Travel zones built from each area's own mapped content** — a convex hull of its hotels and
  places, offset outward and smoothed, drawn as a tinted wash with a fine dashed edge. A hull keeps
  the shape of the content (Canggu is a coastal strip, Uluwatu is a cliff line) where a radius
  circle said nothing. Dashed means approximate, and the UI says so in words. The zones are drawn
  *below* the basemap's water layer so they clip to the coastline instead of floating out to sea.
- **One scope at a time.** EXPLORE draws the nine stay bases or the six day-trip zones, never all
  fifteen at once — the panel's segmented control and the map share one piece of state through the
  UI store, so the list and the map cannot disagree.

### Trip builder
- Dates generate days; travellers, travel styles, budget tier and loyalty programmes are captured.
- Add hotels, activities, nature, beaches, restaurants and transport points to a specific day.
- Reorder within a day (drag **and** accessible move up/down) and move between days.
- Changing dates preserves as much of the plan as possible and warns when something no longer fits.
- Trips persist across refreshes in `localStorage`.

### Map ↔ itinerary synchronisation
- Selecting a day renumbers the map and redraws the route.
- Hovering a row emphasises its marker; clicking a marker selects its row.
- Waterfall: airport → hotel → activity → activity → restaurant → hotel.

### Routing and efficiency
- Routing provider abstraction with **real OSRM road geometry** as the default and a documented
  great-circle estimator as the fallback. Distance and travel time are separate abstractions and are
  never conflated.
- Efficiency engine that flags long transfers, spread-out days, backtracking, hotel/activity
  mismatch and over-packed days, and proposes concrete relocations with a one-click apply.

### Honesty layer
- Every coordinate carries `verified` / `approximate` / `demo` plus a note about what it marks.
- No prices anywhere. Hotel cost is a brand-positioning tier with its basis shown.
- Flight data is labelled sample data. Provider adapters for live data exist but are inert.
- Empty states that explain themselves (including "neither loyalty programme has a property here").

---

## V1.1 — depth over breadth

The goal is to make the reference destination genuinely trustworthy and the others honest.

- **Deep data for the remaining destinations, or a shorter list.** Take Phu Quoc, Da Nang / Hoi An
  and Siem Reap to Bali's depth; drop or clearly badge anything that cannot be.
- **Real area boundary polygons** where an official one genuinely matches the travel area.
  Where the travel area is inherently approximate — Canggu is three villages, "Nusa Dua" in
  traveller usage includes Tanjung Benoa — the zone stays approximate and keeps saying so.
- **Property photography for the sixteen Bali hotels that have none.** Wikimedia Commons and
  Openverse do not cover them; this needs the properties' own media kits or a commercial image
  provider, with the same verification bar (the photo must be provably of that property).
- **Opening hours and closure days on the timeline.** A day that ends at Uluwatu after the Kecak
  dance has sold out is an inefficient plan too.
- **Weather and seasonality overlays** — surf season, monsoon timing, and the holiday calendar that
  drives Balinese traffic.
- **Trip comparison.** Two destinations, two area choices, or two hotel bases side by side on
  distance and travel time.
- **Shareable read-only itinerary** via a signed URL. A trip is already a self-contained JSON object.
- **Multi-trip management UI** (list, rename, duplicate, archive) instead of only switching.
- **Automated data validation in CI**: schema, coordinate bounds, duplicate ids, brand-registry
  coverage, same-property-plotted-twice detection, entities outside their destination's map
  bounds, and a "no price-like field" assertion. *(Shipped in V1; the remaining work is wiring
  `npm run validate:data` and `npm run test:e2e` into CI.)*
- **Accessibility audit** with a screen reader and keyboard-only pass; a written audit log.
- **PWA shell** with offline map tiles for the downloaded destination.

---

## V2 — live data, accounts, and planning intelligence

### Live data behind the existing interfaces
- **Live flight prices** via Amadeus Self-Service or a Skyscanner-compatible partner API, rendered
  as an explicitly attributed live layer with a fetch timestamp.
- **Live hotel pricing and availability** for Marriott Bonvoy and Hilton Honors, if acceptable
  partner terms can be obtained. Until then, the tier model stays and no numbers are shown.
- **Award and points valuation.** `Hotel.loyaltyMeta` exists and is empty for exactly this reason:
  the shape is ready, and nothing is claimed before there is a maintained source.
- **Elite benefit comparison**, driven entirely by versioned data so it can be updated without a
  release.
- **Visa and entry requirements** with a review date on every claim.
- **Restaurant reservations and activity booking** via affiliate or partner deep links, clearly
  marked as external and clearly marked as paid where applicable.

### Planning intelligence
- **AI itinerary generation**, constrained by the efficiency engine rather than replacing it: the
  model proposes, the geometry disposes. Generated plans must be explainable stop by stop.
- **A real traffic model** in the routing layer, so "≈40 minutes" becomes "40–75 minutes at this
  hour on this day".
- **Cost calculator** once live pricing exists, in the traveller's currency, with points-vs-cash.

### Product and platform
- **Accounts and cloud-synced trips**, replacing `localStorage` without changing the store's public
  surface.
- **Collaborative trips.** Multiple planners, comments, and voting on candidate stops.
- **Native mobile apps or a mature PWA** — the map-first interface is already the right shape for a
  phone.
- **A public data contribution flow** with review, so destination depth scales beyond what one team
  can verify by hand.

---

## Explicitly not planned

- **Fake live data.** No generated prices, no invented "12 people are looking at this", no
  unsourced claims about elite benefits.
- **A conventional OTA booking funnel.** Meridian decides *where* and *in what order*; booking is a
  hand-off, not the product.
- **Content marketing.** No listicles, no SEO articles, no hero banners. If it does not help someone
  understand where things are, it does not ship.
