# Meridian — build process log

This document is the engineering record of how this product was built: what was
decided, what broke, and what was fixed. It is written for review, not marketing.

---

## 0. Starting conditions

The working directory was **completely empty** — no repository, no `git`, no existing
stack to reuse. Node 24 / npm 11 on macOS (Apple Silicon).

One environment problem had to be solved before anything else: `~/.npm` was root-owned, so
`npm install` failed with `EPERM`. The project ships an `.npmrc` that redirects the cache into
the repository, and `npm install --cache=./.npm-cache` works around an overriding env var.

---

## 1. Stack decisions, and why

| Decision | Reason |
| --- | --- |
| **Next.js 15 (App Router) + React 19 + TypeScript** | Requested. App Router gives static pre-rendering for all 10 destinations and keeps the map out of the server bundle. |
| **MapLibre GL + vector tiles** | See §3. Raster tiles bake their labels into pixels; only vector tiles let us cut label noise. |
| **Zustand with `persist`** | Two small stores (trips, UI) persisted to `localStorage`. Manual hydration (`skipHydration` + explicit `rehydrate()`) keeps server and first client render identical, which avoids hydration mismatches. |
| **No component library, no icon font, no utility CSS framework beyond Tailwind** | The whole UI kit is ~5 files. This was a deliberate constraint: a travel planner's UI surface is small, and pulling in a design system would have dictated the visual language rather than the product doing so. |
| **Tailwind 3 with CSS custom properties** | Tokens live in `app/globals.css` as CSS variables and are mirrored in `tailwind.config.ts`, so the map style and the UI can read the same palette. |
| **OSRM for routing, with a geodesic estimator fallback** | Real road geometry and drive times, free, keyless. Distance and travel time are separate abstractions and never conflated. |

Runtime dependencies at the end: `maplibre-gl, next, react, react-dom, zustand` — **five**.

---

## 2. Data strategy, and what verification caught

The brief demanded real coordinates and forbade inventing live data. Rather than write the
datasets from memory, the data went through a **coordinate-verification pass**: bulk Wikidata
bounding-box queries, the Wikipedia coordinates API, and OpenStreetMap element ids, with every
record keeping its source.

That pass caught six things that would otherwise have shipped wrong:

1. **Bali has only five Hilton-branded hotels.** There is no DoubleTree, Curio, Tapestry,
   Canopy or Waldorf Astoria trading in Bali (Waldorf Astoria Nusa Dua is announced for 2027).
   The first draft contained a DoubleTree that does not exist. It was deleted.
2. **Siem Reap's airport code is `SAI`, not `REP`** — REP closed in October 2023.
3. **Phnom Penh moved to Techo International (`KTI`)** in September 2025; the old `PNH` field
   no longer serves commercial traffic.
4. **El Nido's IATA code is `ENI`**; "LIO" is only the local airstrip name.
5. **Le Méridien Angkor is closed.** Marriott's marketing pages are still live, which is why it
   is widely listed as open. It is excluded.
6. **Four Points by Sheraton Palawan is in Sabang**, about two hours from Puerto Princesa city.

Final dataset: **10 destinations · 48 areas · 43 loyalty hotels · 119 places**, of which
**5 places are marked `approximate`** and drawn with a visible badge. There are **no prices
anywhere** — hotel cost is a brand-positioning tier, and the basis is shown on every card.

A data validator (`npm run validate:data`) runs schema, coordinate-range, duplicate-id, NaN-radius,
brand-registry and unknown-area-reference checks, plus a "no price in a description" assertion.
Every check in it exists because the corresponding failure actually happened once.

---

## 3. The basemap — the central design problem

### The problem

The first build used OpenStreetMap raster tiles with a CSS desaturation filter. It looked like a
map-library demo: dense place names, motorway shields, POI clutter, mixed-language labels — all
competing with our own markers. **Raster tiles bake labels into the pixels, so no CSS can fix it.**

### The decision

Migrate the map engine to **MapLibre GL** and **author our own style** over free, keyless vector
tiles (`components/map/basemap-style.ts`). We deliberately do **not** load a vendor style JSON at
runtime: a remote style can change or start watermarking without warning, and we would lose control
of label density.

Tile hosts, both free and requiring no account:

- **primary** — CARTO `carto.streets` vector tiles. Note: CARTO's *style JSON* is now watermarked
  and their keyless *raster* tiles return an "API KEY REQUIRED" image, but the **vector tiles** are
  open and CORS-enabled. We take the tiles and supply the cartography.
- **fallback** — OpenFreeMap planet tiles, swapped in automatically after sustained tile failures.

The authored style cuts labels to **country → region → city → town**. No villages, suburbs,
hamlets, POIs, road names, house numbers or waterway names. Base city labels do not begin until
zoom 6, because below that the destination markers *are* the city labels. English is preferred via
`name_en`. Land, water, borders and roads all resolve to the product's own tokens.

### Two failures worth recording

**Blank canvas.** MapLibre parses tiles in a web worker resolved at runtime through
`import.meta.url` — something a bundler cannot follow. Under Next.js the worker never loaded and
the map rendered as an empty canvas. `scripts/vendor-maplibre-worker.mjs` now copies the worker
into `public/` before every dev run and build, and fails loudly if a MapLibre upgrade moves those
files rather than shipping a silently blank map.

**A grey veil over the planning map.** A 3.5% grey fill on inactive areas looked harmless in
isolation. At destination zoom the viewport sits inside ten or more overlapping stay areas and
day-trip zones, and the fills compounded into a flat grey wash that made the planning map look
like mud. Inactive areas are now outline-only. Isolating it took an A/B test (rendering the map
with the area layer mounted and unmounted, then sampling rendered pixels) because the cause was
not visible by inspection.

---

## 4. Other real bugs found by testing

These were genuine defects, not polish:

1. **The region bounds excluded Bali.** A hard-coded bounding box had drifted out of date and left
   a destination entirely off-screen. Bounds are now derived from the data, so adding a destination
   later cannot reproduce the bug.
2. **`minZoom` clamped the mobile fit**, pushing Singapore — the origin — off the left edge on a
   390 px viewport. The minimum zoom must stay below the fitted zoom for the narrowest viewport.
3. **Marker `z-index` escaped the map's stacking context.** Markers set a z-index for ordering
   inside the map; without isolation those values competed with page chrome, and a map marker
   floated above the mobile bottom sheet. Fixed with a stacking context on the map root.
4. **A silently rejected style expression was invisible.** The map's error handler only counted
   tile failures, so a bad style expression produced no diagnostic at all. All map errors are now
   logged in development. This cost real debugging time and was worth fixing properly.
5. **Area labels repeated four or five times.** Placing labels from large radius polygons let the
   placement engine find several valid positions inside one shape. Labels now come from a dedicated
   one-point-per-area source.

---

## 5. Product decisions worth arguing about

- **No prices, anywhere.** No fares, no nightly rates, no availability. There is no pricing source
  in V1 and inventing numbers would be worse than omitting them. Provider adapters for Amadeus and
  a Skyscanner-compatible API exist and are inert without credentials.
- **Selecting a destination never leaves the map.** Comparison is a spatial task; navigating away
  to a detail page destroys the thing the product is for.
- **Adding a place does not switch panels.** Adding three stops while browsing a list should not
  yank the user out of the list. The button flips to "Added to Day N" and the map gains a numbered
  marker instead.
- **`4D3N` shorthand was removed.** Travellers read "4–7 days"; the shorthand reads like a database
  enum. The same reasoning removed `FULL` badges, `16M/5H` counts and airport-code-first rows.
- **Area boundaries are dashed radius circles, not invented polygons.** The dash pattern and the
  tooltip say "approximate extent". Real boundaries are a data task, and drawing a guess as if it
  were official would be dishonest.
- **Efficiency analysis is geometric.** It flags long transfers, spread-out days, backtracking,
  hotel/activity mismatch and over-packed days, and proposes concrete relocations. It never claims
  to know that a temple closes at 17:00. Every message quotes the number it is based on.

---

## 6. Verification

`npm run test:e2e` drives a real Chromium against the running app through the whole V1 workflow and
asserts on the DOM. It fails on console errors, uncaught page errors and failed requests.

**Result: 67/67 checks pass, 0 console errors, 0 page errors, 0 failed requests.**

Coverage: homepage → region map → Singapore origin → destination selection (including that all ten
destinations are genuinely rendered, queried through the map engine) → preview card → planner →
layer toggles → Marriott/Hilton filtering → price tiers → marker → detail card → trip date
generation → add to itinerary → reorder → move between days → day/map emphasis sync → route
geometry → efficiency panel → transport panel → refresh persistence → mobile layout → all nine
other destinations load without crashing.

`npm run build` succeeds: 10 destinations pre-rendered, 202–224 kB first load.

---

## 7. Known limitations

1. **No prices, at all.** Deliberate.
2. **No backend and no accounts.** Trips live in `localStorage` on one browser.
3. **Only Bali is deep.** The other nine destinations have enough data to be selectable and to
   demonstrate the architecture; they are not yet good enough to plan a real trip from.
4. **Destination labels collide at overview zoom.** Phnom Penh can lose its label to Phu Quoc and
   Ho Chi Minh City. Hovering always reveals it and the dot never disappears, but a proper label
   priority pass is future work.
5. **Traffic is not modelled.** Routing returns a normal-traffic drive time.
6. **Area shapes are radius circles**, not real administrative boundaries.
7. **No photography.** Descriptions and the map carry the product.
8. **The public OSRM demo server** is rate-limited and not for production.

---

# Iteration 2 — the destination experience

The Southeast Asia homepage was left alone. This pass rebuilt **the Bali destination
experience**, which worked technically and failed as a product: it opened on a trip form, drew every
category at once, and had no photography at all.

## What changed, and why

### The navigation became a progression

`Trip · Places · Areas · Route · Flights` described the system's nouns. It is now
**EXPLORE → STAY → DO → PLAN**, which are the traveller's verbs:

| Tab | Question | Map shows |
| --- | --- | --- |
| EXPLORE | Which part of Bali suits me? | Areas labelled with their tagline |
| STAY | Which property? | Loyalty hotels, individual markers |
| DO | What should I actually do? | One category at a time |
| PLAN | How does the trip fit together? | The active day's route |

The destination now **opens on EXPLORE at whole-island scale**, not on a form. The previous build
asked for dates before the traveller understood the island.

### The map shows one thing at a time

The single biggest cause of the old "marker soup" was drawing every category simultaneously. Each
tab now owns its layer set, and **each tab re-frames the camera**. That second part turned out to
matter more than expected: switching to STAY previously left the camera at whole-island scale, where
all 21 hotels collapsed into four clusters and neither loyalty programme was distinguishable. The
camera is part of the navigation.

### Areas are the primary content of EXPLORE

Six headline regions carry an authored two-or-three word tagline — `CANGGU / Surf · Cafés`,
`ULUWATU / Cliffs · Sunsets` — drawn directly on the map as a two-line label with an anchor dot.

Making all six legible at island scale took two attempts. A fixed label anchor meant Canggu, Nusa Dua
and Sanur were dropped by the collision engine at exactly the zoom where they matter most, because
south Bali has six named regions inside ~30 km. `text-variable-anchor` lets each label choose
top/bottom/left/right of its dot, and a `symbol-sort-key` gives the headline regions collision
priority over excursion zones.

Area order is curated rather than computed. Sorting by "amount of stuff" put the Nusa Dua resort
enclave first, which is a reasonable metric and the wrong editorial choice.

### Photography

`lib/images/` is a provider layer. Components ask for images by `(entityKind, entityId)` and never
construct a URL.

**Source: Wikimedia Commons** — free by policy, machine-queryable, and it returns licence and author
with every file. `scripts/fetch-bali-images.mjs` resolves 80 subjects, scores candidates on
subject-token overlap, aspect ratio and resolution, rejects known-bad matches, then downloads and
resizes them into a committed manifest.

**The `subject` field is the honesty mechanism.** Commons has almost no hotel photography for Bali.
Three properties have genuine photos of themselves; the rest borrow their area image. Rejecting bad
matches mattered: the first pass picked a bird for a Hilton Garden Inn, a competitor's resort for a
Renaissance, and a fashion shoot for the Ritz-Carlton. Those subjects are now forced to the area
fallback and the card prints *"Area photo — not this specific property"*.

Fallbacks are a first-class state: no image, a failed image and a representative image each have a
designed treatment. The test suite forces every image on the page to fail and asserts the page
survives.

### Transport became a first-class itinerary item

`TransportLeg` carries mode, rationale, alternatives, distance, duration, geometry, source,
confidence and a multimodal descriptor. The timeline alternates PLACE and TRANSPORT LEG.

**Routing and recommendation are deliberately separate.** `lib/routing/` answers how far and how
long by road (OSRM by default — free, keyless; server-only adapters for OpenRouteService, Mapbox and
Google Routes behind `/api/route`, so keys never reach the browser). `lib/transport/recommend.ts`
answers what the traveller should actually do, and states its reasoning in the UI.

**Nothing is fabricated.** `RouteResult` cannot carry a number unless a provider produced one, so
the UI cannot print an invented duration by accident. An unanswered route renders as *"Route
unavailable"* and shows only the straight-line distance, explicitly labelled as not a driving
distance. The geodesic estimator still exists but is fenced off to the route-efficiency heuristics,
where it is labelled a heuristic.

Water crossings are modelled as data, so `Ubud → Nusa Penida` correctly renders as a two-mode leg
("car to Sanur Harbour, then a fast boat") in the tests.

## Bugs this pass surfaced

1. **`hotel is not defined`** — a crash on adding a place. A bulk text replacement had written the
   hotel branch's identifier into the place and custom-stop branches. It only fired after a place
   was added, which is why the map handle disappeared in later assertions.
2. **Card → marker hover did nothing.** Emphasis compared the hovered id against the *itinerary
   item* id only, so hovering a hotel or place card in STAY/DO never highlighted its marker.
3. **Focusing an area dropped to street level.** The focus controller honoured its zoom ceiling for
   bounds but not for a single point, where it forced zoom ≥ 14.
4. **The area filter was invisible.** Choosing Uluwatu in EXPLORE silently carried into STAY and
   produced an empty list with no way to see why. There is now a removable filter chip, and empty
   states offer the way out rather than just describing it.
5. **The region fit was capped the wrong way.** A `fitMaxZoom` intended to prevent over-zoom-out
   was in fact zooming the island *out*, because it caps zoom-in.

## Verification

**70/70 checks pass, 0 console errors, 0 page errors, 0 failed requests.**

New coverage this pass: whole-island framing on arrival, all six headline areas present *and*
actually rendered at island scale, area photography loading, area focus zoom staying in range,
inherited area filter being visible and removable, hotel photography, Marriott/Hilton filtering,
card → marker hover synchronisation, category switching changing the place set, the first-run form
containing exactly three fields, one transport leg per consecutive pair, legs declaring their data
source, a measured leg showing distance and duration, the map drawing the same day as the timeline,
day switching changing the route, and broken images not crashing the page.

## Known limitations after this pass

1. **Only three Bali hotels have real photography.** The rest show their area image, disclosed as
   such. This is a genuine Commons coverage limit, not a bug.
2. **Photography is licensed CC BY / CC BY-SA / CC0 and credited, but not curated by hand.** Some
   images are competent documentation rather than beautiful travel photography.
3. **Attributes in image URLs are not decoded**, so an `alt` can contain `&amp;`.
4. **Multimodal routing is not solved.** Water crossings are curated data for Bali only; a
   multi-leg journey across a harbour is described, not routed.
5. **Traffic is not modelled**, so a measured leg is a free-flow estimate and says so.
6. **Area shapes remain radius circles**, not administrative boundaries.
7. **Non-Bali destinations have no photography** and show the fallback state throughout.

---

# Iteration 3 — making Bali good enough to actually use

The brief for this pass was narrow and unforgiving: **do not redesign the information
architecture again, do not add features, and do not expand to another destination.** Fix
photography, fix the remaining visual weakness of EXPLORE / STAY / DO, represent the travel areas
honestly, make transport legs first-class in PLAN, and clean up the small data-quality problems.
The standard to hit was "I would use this instead of Google Maps plus six browser tabs".

What follows is what the work actually turned up.

## 1. The basemap had no island in it

The first thing a fresh screenshot showed was that Bali had no silhouette. Land was `#F6F5F1`
and sea was `#DCE4E8` — a colour difference of about twenty values — and nothing in the style
drew a coastline at all. At island zoom the map read as a blank cream rectangle with some blurred
blobs on it.

Three changes fixed it, and none of them added a label or a marker:

- **A deeper, cooler sea** (`#D2E1E8`) so land has something to be lighter than.
- **A coastline stroke.** Neither tile host ships a coastline layer, so the water polygons are
  stroked instead. Lakes and rivers get an edge too, which at planning zoom is useful rather than
  noise. This single layer did more for the map than anything else in the pass.
- **Roads that exist at island scale.** Primary-road widths at z6–9 were 0.6–1.6 px of white on a
  near-white ground: invisible. Secondary and tertiary roads now start at z9.5 rather than z11.
  At planning zoom the road network *is* the useful context — it is what tells you whether two
  stops are realistically connected.

Vegetation opacity was also raised, because the interior of Bali is rice terrace and forest and
the map was claiming it was empty.

## 2. Travel zones, third attempt — and the honest answer

The previous pass replaced radius circles with a **radial envelope** around each area's centroid.
It was still wrong, and the screenshot said so plainly: a radial envelope around a centroid
degenerates into a circle whenever the content is sparse, so the map showed twenty-two interlocking
grey circles with blurred edges. Worse, the blur made them read as smudges — the whole south of
the island was one dirty cloud, and the sea had pale halos floating on it.

The zone is now built from three honest parts:

1. **A convex hull of the area's own mapped content**, offset outward and smoothed. A hull keeps
   the *shape* of the content: Canggu stays an elongated coastal strip, Uluwatu stays a cliff
   line, and only a genuinely point-like area comes out round. A minimum thickness stops a
   two-point hull from rendering as a sliver.
2. **A fine dashed edge.** Dashes are the conventional cartographic signal for "approximate", so
   the boundary never pretends to be an administrative one.
3. **A soft halo that only selected and active zones get.** Emphasis is earned by interacting,
   not applied to everything by default.

Two further decisions matter as much as the geometry:

- **The zones are inserted *below* the basemap's water layer.** A padded hull derived from coastal
  content will always spill past the shoreline. Left on top, the result was dashed arcs floating
  out over the sea. The tile source carries real ocean polygons, so drawing the zones beneath the
  water clips them to land for free — the same trick a paper map uses when it prints the sea last.
- **The map now draws one scope at a time.** EXPLORE lists nine stay bases or six day-trip zones,
  never all fifteen at once. The panel's segmented control and the map share that state through
  the UI store, so the list and the map can no longer disagree. Drawing everything was the single
  biggest reason the island map looked busy.

## 3. Photography: four hotels have it, sixteen honestly do not

Photography was the weakest part of the product and it is the part the brief put first. The
resolver was rebuilt around one rule: **a hotel photo may only be used if it is provably of that
property.**

The old resolver matched on the property's name appearing in a filename, which is not the same
thing at all. Running the hardened rules against the live sources showed exactly what that had
been letting through:

| Candidate | What it actually is |
| --- | --- |
| `Four Points by Sheraton Taipei Bali 01.jpg` | A hotel in **New Taipei City**, in a district called Bali |
| `Blanco Renaissance Museum Ubud Bali.jpg` | A **museum** in Ubud, matched on the word "Renaissance" |
| `Le Meridien Nirwana Bali Pool garden.jpg` | A **different resort**, in Tabanan, 30 km from Jimbaran |
| `The Pond with Stepping Stones, Karangasem Palaces.jpg` | A palace pond, matched on "stones" |
| `Four Points By Sheraton Bali Ungasan, Infinity Pool.jpg` | Deleted from Commons; Openverse still advertises it |

There is now a per-property rule table requiring the file title to name both the property *and*
the right part of Bali, a global reject list (Taipei, museums, the Nirwana resort), and a link
check that fetches every candidate and drops it if the source file no longer exists. The last one
is why the Four Points Ungasan pool photo — which looks like a genuine win — is **not** in the
product: the file is gone, and shipping a 404 dressed as a resort pool is worse than shipping
nothing.

The result is **4 subjects with useful, verified property photography out of 20 hotels** — St. Regis
(beach), W Bali (pool, exterior), Conrad (room, grounds) and Umana (room, exterior). Sixteen
hotels have no entry in the manifest at all and say so:

> No property photography available for this hotel

They never borrow their area's beach photograph. That is the whole point of the state.

Two corrections came from *looking at the images* rather than trusting their filenames:

- **Conrad's hero was a dark photograph of the word "CONRAD" on a wall.** The filename contains
  "resort & spa", so the classifier called it a spa photo. The room photo that was sitting in the
  gallery slot is now the hero; the signage is last.
- **Signage was then removed altogether.** The Westin's only photo, and one of Conrad's three, are
  close-ups of the resort's name on a wall. They are real, correctly licensed and provably of the
  property — and they are not property photography: a traveller choosing between two Nusa Dua
  resorts learns nothing from a dark photograph of the word "WESTIN", and a card led by one is
  worse than a card that says plainly that no photography is available. They are excluded from the
  manifest, and the exclusion is logged by the generator so the coverage number stays honest.

Places fare far better than hotels: **41 of 48 Bali places and all 15 areas have photography**, and
the seven that do not are three beach clubs and four logistical waypoints.

Photography is also no longer a fixed 3:2 hole when it is missing. A place with no photo gets a
compact text-led card instead of an empty box the same size as the photograph it replaces — which
had been pushing two cards off the screen and making the list look broken.

## 4. Transport legs, first-class

PLAN now reads as a schedule rather than a list. Between each pair of stops:

```
09:00  The Westin Resort Nusa Dua, Bali
         ↓
       Car / Grab · ≈25 min · 21 km
       About 21 km by road distance. Ride-hailing works…
       OSRM road route · free-flow estimate
       or a private car and driver / a taxi
09:25  Uluwatu Temple (Pura Luhur Uluwatu)
```

The mode, the measured duration and the measured distance are on one line; the rationale and the
data source are underneath; the alternatives are named. Where no routing engine answered, the leg
says **No route data** and the day's clock is marked `approx` rather than shown with a confidence
it has not earned. Traffic is not modelled and the leg says so by calling itself a free-flow
estimate.

## 5. Three real data bugs, and the checks that now catch them

**The same hotel was in the product twice.** `four-points-by-sheraton-bali-ungasan` and
`four-points-bali-ungasan` were two records for one property, at identical coordinates, with two
different Marriott property codes (`DPSFG` and `DPSFP`). The duplicate-id check could not see it
because the ids differed — the STAY list simply showed Four Points Ungasan twice. Only `DPSFG` is
real (verified against marriott.com); the other record is deleted. The validator now compares
every hotel against every other in the same destination within 150 m and fails if two records name
the same physical site.

**An entity could sit outside its own map bounds.** The destination map fits `mapBounds` on
arrival, so an entity outside them is one the traveller can never see without panning into empty
space — and it is the signature of a transposed lat/lng. The validator now asserts every hotel and
place falls inside its destination's bounds. It immediately proved that the other nine
destinations are clean.

**A third of the photography was filed under ids that no longer existed.** The image
generator keeps its own hand-written search list, and that list had drifted from the dataset:
`jatiluwih-rice-terraces` against `jatiluwih-rice-terrace`, `amed-beach` against `jemeluk-beach`,
`old-mans-canggu` against `old-mans`, and so on for eleven places and three areas. The manifest is
keyed by string, and a key that matches nothing looks exactly like an entity that has no
photography — so the product showed Jatiluwih Rice Terraces, Mount Batur, Kelingking, Jimbaran,
Amed, Goa Gajah and the rest as **"no photo yet"** while their photographs sat unused on disk. The
same drift had left five subjects in the generator for places that no longer exist, so images were
being downloaded for entities nobody could reach.

Seventeen places and two areas regained their photography once the ids were realigned. The
validator now fails if any manifest key is not a real entity, and fails again if the generator's
own id list names anything the dataset does not contain. That is the durable half of the fix: the
drift cannot come back silently.

Two things are deliberate rather than fixed. `sunset-road`, `ubung-bus-terminal`,
`beachwalk-kuta-pickup` and `seminyak-village-pickup` are logistical waypoints — a road strip, a
bus station and two meeting points. Any photograph we could find for them would be a stand-in for
"somewhere in Kuta", which is exactly the borrowed imagery this pipeline exists to prevent, so
their cards say "no photo of this place yet" and the generator documents why.

Smaller fixes in the same pass:

- **Alt text is entity-clean.** A truncated HTML description had been producing an `alt` that
  began with a bare ampersand ("& JIWA spa treatment room"). Zero `&amp;`, `&quot;` or `&#`
  sequences remain, verified by grep against the generated manifest.
- **A stale detail card followed you between tabs.** A hotel's card stayed open over the DO list
  and over the itinerary. It is now dismissed when you move between steps.
- **The resolver threw away a twenty-minute run on one dropped connection.** Every HTTP call now
  retries with backoff, and Openverse results whose Commons file has since been deleted are
  re-resolved against Commons before they are dropped.

## 6. What the verification actually covers

`npm run test:e2e` — **73/73 checks pass, 0 console errors, 0 page errors, 0 failed requests.**

Three of those checks had to be rewritten in this pass because they were asserting on the wrong
thing:

- **`querySourceFeatures('route')` returned zero while the route was plainly painted on screen.**
  It reads the tiles that happen to be loaded, and a GeoJSON line can be visible while that call
  returns nothing. The check now asserts on *rendered* features, and cross-checks the line against
  the panel: a solid line must be backed by a named routing engine, and a dashed one must be a day
  where no leg had route data. If the map and the legs ever disagree, the test fails.
- **The route check sampled one frame.** `next dev` compiles on first request and the camera
  animates; a single sample turned a working route into a failing test. There is now a shared
  `until()` poller.
- **The inherited-area-filter check raced the panel's first paint.**

## Known limitations after this pass

1. **Sixteen of twenty Bali hotels have no property photography at all.** This is a genuine
   Wikimedia Commons and Openverse coverage limit for Bali's Marriott and Hilton properties, not a
   bug, and it is reported to the user rather than papered over — those cards say "No property
   photography available for this hotel" and never borrow the area's beach photograph. Fixing it
   properly means licensed photography: a commercial image provider, or the properties' own media
   kits, with the same verification bar.
2. **The travel zones are approximations and say so.** They are hulls around mapped content, not
   administrative boundaries and not official tourism areas. Uluwatu's zone stretches ~9 km
   because three of its hotels sit at Ungasan, and the zone has to contain them.
3. **Traffic is not modelled.** Every measured leg is a free-flow estimate, labelled as one.
4. **Multimodal journeys are described, not routed.** Ubud → Nusa Penida is curated data (drive to
   Sanur Harbour, fast boat); the boat crossing has no timetable and no live availability.
5. **Photography is not hand-curated.** Licences are restricted to commercial-use (CC BY, BY-SA,
   CC0, public domain) and every image carries its author, licence and source page, but some
   images are competent documentation rather than beautiful travel photography.
6. **The whole image set is ~32 MB**, which is heavy for a tunnel deployment. Each image is
   1100 px at quality 68 and lazy-loaded, so it is not on the critical path, but a CDN with
   responsive variants is the correct answer.
7. **Only Bali is deep.** The other nine destinations are selectable and architecturally complete;
   they are not yet good enough to plan a real trip from.
8. **No backend, no accounts.** Trips live in `localStorage` on one browser.
