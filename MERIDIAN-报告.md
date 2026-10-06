# Meridian — 项目报告（供 AI 分析）

> 这是一份自包含的工程报告。把它上传/粘贴给 ChatGPT，它就能完整分析这个产品的设计、技术决策和实现过程。
> 生成时间：2026-10-06 · 项目路径：/Users/suiwenke/Desktop/TravelAgent

---

## 目录

1. 项目概览（机器可读摘要）
2. 制作过程记录（决策、踩坑、修复）
3. 架构说明（README 摘录）
4. 路线图

---

## 1. 项目概览（project.json）

```json
{
  "name": "Meridian",
  "tagline": "Map-first Southeast Asia travel planner for travellers departing from Singapore",
  "status": "V1 — working end to end, no live data",
  "productThesis": "An interactive geographic decision-making tool that helps Singapore-based travellers decide where to go, where to stay, what to do, and how to arrange those places into an efficient trip. The map is the product; the itinerary is built around the map.",
  "repository": {
    "runtimeDependencies": ["maplibre-gl", "next", "react", "react-dom", "zustand"],
    "language": "TypeScript",
    "framework": "Next.js 15 App Router / React 19",
    "styling": "Tailwind CSS 3 with CSS custom properties as design tokens",
    "state": "Zustand with persist middleware (localStorage), manual hydration",
    "tests": "Custom Playwright-driven end-to-end suite (scripts/e2e.mjs)",
    "dataValidation": "scripts/validate-data.ts (tsx)"
  },
  "mapEngine": {
    "library": "MapLibre GL JS",
    "tiles": "vector",
    "styleAuthoredInRepo": "components/map/basemap-style.ts",
    "primaryTileHost": { "id": "carto", "product": "carto.streets vector tiles", "cost": "free, no API key, CORS open" },
    "fallbackTileHost": { "id": "openfreemap", "product": "OpenFreeMap planet tiles", "cost": "free, no API key, no limits" },
    "whyVectorNotRaster": "Raster tiles bake labels into pixels. Vector tiles allow cutting the label set to country/region/city/town, forcing English, and applying the product's own palette.",
    "labelPolicy": "No villages, suburbs, hamlets, POIs, road names, house numbers or waterway names. Base city labels start at zoom 6.",
    "knownConstraint": "MapLibre's web worker is resolved via import.meta.url, which a bundler cannot follow. scripts/vendor-maplibre-worker.mjs vendors it into public/ before dev and build."
  },
  "routing": {
    "primary": "OSRM (real road geometry, road distance, drive duration)",
    "fallback": "Geodesic estimator with a documented speed model",
    "abstraction": "lib/routing — distance and travel time are separate fields and never conflated",
    "trafficModel": "none"
  },
  "dataScope": {
    "destinations": 10,
    "areas": 48,
    "loyaltyHotels": 43,
    "places": 119,
    "placesWithApproximateCoordinates": 5,
    "hotelGroups": ["Marriott Bonvoy", "Hilton Honors"],
    "pricesShown": "none — hotel cost is a brand-positioning tier whose basis is displayed",
    "verificationMethod": "Wikidata bounding-box queries, Wikipedia coordinates API, OpenStreetMap element ids; every record keeps its source"
  },
  "correctionsFoundDuringVerification": [
    "Bali has only five Hilton-branded hotels; a DoubleTree in the first draft does not exist and was removed",
    "Siem Reap's airport code is SAI, not REP (REP closed October 2023)",
    "Phnom Penh moved to Techo International (KTI) in September 2025",
    "El Nido's IATA code is ENI; LIO is only the local airstrip name",
    "Le Meridien Angkor is closed but still marketed as open by the brand",
    "Four Points by Sheraton Palawan is in Sabang, ~2 hours from Puerto Princesa city"
  ],
  "bugsFoundByTesting": [
    "Fixed region bounds excluded Bali, leaving a destination off-screen — bounds are now derived from the data",
    "minZoom clamped the mobile fit and pushed the Singapore origin off the left edge",
    "Marker z-index escaped the map stacking context and floated above the mobile bottom sheet",
    "A 3.5% fill on inactive areas compounded across 10+ overlapping areas into a grey veil over the planning map",
    "Area labels repeated 4-5 times because they were placed from large polygons instead of a one-point-per-area source",
    "MapLibre's worker failed to load under the bundler, leaving a blank canvas with no error"
  ],
  "testResults": {
    "checks": 67,
    "passed": 67,
    "failed": 0,
    "consoleErrors": 0,
    "pageErrors": 0,
    "failedRequests": 0,
    "productionBuild": "passes; 10 destinations pre-rendered; 202-224 kB first load"
  },
  "knownLimitations": [
    "No prices anywhere — deliberate, there is no pricing source",
    "No backend or accounts; trips live in localStorage on one browser",
    "Only Bali is deep; the other nine destinations are starter-scope",
    "Destination labels can collide at overview zoom",
    "Traffic is not modelled",
    "Area shapes are radius circles, not real administrative boundaries",
    "No photography",
    "The public OSRM demo server is rate-limited and not for production"
  ],
  "documents": {
    "process": "/docs/PROCESS.md",
    "readme": "/docs/README.md",
    "roadmap": "/docs/ROADMAP.md",
    "browsableDossier": "/process"
  }
}
```

---

## 2. 制作过程记录（PROCESS.md）

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

## 3. 架构说明（README.md）

# Meridian — Map-first Southeast Asia Travel Planner

A working V1 of an interactive geographic decision-making tool for travellers departing from
**Singapore**. The map is the product: you pick where to go, understand where the hotels and
attractions actually are, and arrange them into a trip that makes geographic sense.

It is deliberately **not** a travel blog, an OTA, or a list-first booking site. There is no hero
banner, no price grid, and — importantly — **no invented pricing anywhere**.

```
Southeast Asia map  →  select a destination  →  destination map
        →  explore hotels / activities / areas  →  add to a day
        →  see the route  →  get told where the plan is inefficient
```

---

## 1. What is in this repository

| Area | What it does |
| --- | --- |
| `app/` | Next.js App Router pages: the region overview and the destination planner |
| `components/map/` | The map engine layer — the only code that knows MapLibre exists |
| `components/region/` | Homepage: Southeast Asia overview, destination rail, preview card |
| `components/destination/` | Planner shell, map toolbar, detail card, panel sections |
| `components/planner/` | Trip builder: setup form, day tabs, itinerary rows, drag & drop |
| `lib/data/` | The whole dataset, typed and registry-driven |
| `lib/routing/` | Routing provider abstraction (OSRM + geodesic estimator) |
| `lib/providers/flights/` | Flight data provider abstraction (static + inert Amadeus/Skyscanner adapters) |
| `lib/efficiency.ts` | The V1 route-efficiency engine |
| `lib/store/` | Trip and UI state, persisted to `localStorage` |
| `scripts/e2e.mjs` | Browser end-to-end test covering the whole V1 workflow |

---

## 2. Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

That is the entire setup. **No API keys are required** — see §5.

Other scripts:

```bash
npm run build        # production build
npm run start        # serve the production build
npm run typecheck    # tsc --noEmit
npm run test:e2e     # drive a real Chromium through the V1 workflow (dev server must be running)
npm run validate:data
```

### If `npm install` fails with `EPERM` on `~/.npm`

Some machines have a root-owned `~/.npm`. The repo ships an `.npmrc` that redirects the cache
into the project, but an environment variable can override it. If you hit this:

```bash
npm install --cache=./.npm-cache
```

---

## 3. Screens and flows

**`/` — Southeast Asia overview.** A full-bleed map with Singapore marked `SIN · Home`, the other
destinations as flag pins, and dashed arcs showing that every route is measured from one origin.
Selecting a marker opens a compact preview **without leaving the map**: route, block time, non-stop
status, recommended trip length, best-for tags, and how many Marriott Bonvoy / Hilton Honors
properties we hold for that destination. `[Explore Bali]` is the only way out of the map.

**`/destination/[id]` — the planner.** Desktop keeps the map dominant with a floating layer
toolbar and a map-anchored detail card, and puts the planner in a fixed right rail. Mobile converts
the rail into a three-snap bottom sheet so the map is never pushed off screen.

Planner sections: **Trip · Places · Areas · Route · Flights**.

---

## 4. Architecture

### 4.1 Data-driven destinations

Adding a destination is a data change, not a UI change:

1. Add `lib/data/destinations/<id>.ts` exporting a `Destination`, an `Area[]`, a `Hotel[]` and a
   `Place[]`.
2. Register it in `lib/data/index.ts` (`DESTINATIONS`).

Everything else — the region marker, the preview card, the planner, the layers, the efficiency
engine — reads from the registry.

### 4.2 Map engine logic is separate from product logic

`MapCanvas` is the **only** component that touches MapLibre's lifecycle. Overlays
(`MarkersLayer`, `DestinationLayer`, `RouteLayer`, `AreaLayer`, `RegionArcLayer`,
`MapFocusController`) are separate components that consume a map instance through context and are
re-registered automatically if the style is ever replaced.

Everything map-related is reached through two `next/dynamic({ ssr: false })` entry points
(`RegionMapView`, `DestinationMapView`), so the engine never enters the server bundle.

`lib/map-markers.ts` converts domain data + the user's plan into a flat marker list. It contains no
React and no map library (its import is a type-only reference), so the rule *"what is on the map
right now"* is testable in isolation. That separation is why swapping the entire map engine could be
done without touching the data layer at all.

`lib/map-markers.ts` converts domain data + the user's plan into a flat marker list. It contains no
React and no Leaflet (its Leaflet reference is a type-only import), so the rule *"what is on the map
right now"* is testable in isolation.

### 4.3 State

Two Zustand stores, both persisted to `localStorage` with manual hydration so server and first
client render agree:

- `lib/store/trip-store.ts` — trips, days, itinerary items. The public surface (`list / create /
  update / delete` + active selection) is deliberately the same shape a server-backed store would
  expose, so moving to a real backend means replacing the `persist` middleware rather than
  rewriting components.
- `lib/store/ui-store.ts` — layer visibility, selection, hover, camera requests. Only preferences
  (`visibleLayers`, `showAreas`, `showRoute`, basemap) are persisted; selection is session state.

### 4.4 Map ↔ itinerary synchronisation

The two views never talk to each other directly; they share one store.

| Action | Consequence |
| --- | --- |
| Select a day | Active day's stops get numbered markers; everything else dims; the route redraws |
| Hover an itinerary row | The matching marker scales up (`emphasised`) |
| Click a marker | Detail card opens **and** the matching itinerary item is selected, if it is already planned |
| Click an itinerary row | The map flies to that stop |
| Apply an efficiency suggestion | The item moves between days and both views re-render |

### 4.5 Routing: distance and travel time are separate abstractions

`lib/types.ts` defines `RoutingProvider`. Two implementations ship:

- **OSRM** (default) — real road geometry, road distance and drive duration.
- **Geodesic estimator** — great-circle distance plus a documented speed model, used automatically
  when the routing endpoint is unreachable or unset.

`lib/use-day-route.ts` always returns something renderable: while loading, and on failure, it falls
back to a **dashed straight-line corridor** and the UI says so. The route cache is keyed by the
point sequence, so panning and zooming never re-hit the network.

Adding Google Routes or Mapbox Directions later means implementing one interface.

### 4.6 Route efficiency (V1)

`lib/efficiency.ts` is geometry-only — no AI, no learned priors, and no invented "minutes saved".
Per day it derives legs, bounding-box spread and cross-area hops, then emits suggestions:

- a single transfer longer than ~28 km (road estimate),
- a day spanning ~42 km or more ("opposite parts of Bali"),
- backtracking, detected with a detour ratio,
- a hotel that sits far from the day's activity centroid,
- a day whose activities plus travel exceed ~11 hours,
- an actionable *"consider moving X to Day N"*, where N is the day whose planned geography already
  fits that stop best.

Every message quotes the number it is based on. When a real routing provider supplies legs for the
active day, the same analysis upgrades to road distances with no change to its contract.

### 4.7 Flight data

`lib/providers/flights/` defines a `FlightDataProvider` interface with a working static provider and
two **inert** adapters (Amadeus, Skyscanner-compatible). They report `isConfigured() === false`
without credentials, and the UI degrades to *"Curated route data"* rather than failing.

**No fares are shown anywhere.** V1 has no pricing source and will not invent one.

---

## 5. Environment variables and map setup

Copy `.env.example` to `.env.local`. **Everything is optional** — the app runs with zero
configuration.

### Basemap

The default is **OpenStreetMap raster tiles**, chosen deliberately:

- CARTO's keyless basemaps now return a watermarked `API KEY REQUIRED` tile.
- Stadia, MapTiler and Mapbox all reject keyless requests.

OpenStreetMap renders correctly without a key. A light CSS filter
(`.leaflet-tile-pane.tiles-muted`) desaturates it just enough to keep markers legible.

Set a key for any provider below and it is promoted automatically. A provider chain
(CARTO → CARTO Voyager → OpenStreetMap) means a blocked CDN degrades instead of showing a grey
rectangle.

| Variable | Provider |
| --- | --- |
| `NEXT_PUBLIC_CARTO_KEY` | CARTO Positron / Voyager |
| `NEXT_PUBLIC_MAPTILER_KEY` | MapTiler Streets |
| `NEXT_PUBLIC_STADIA_KEY` | Stadia Alidade Smooth |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox Light |
| `NEXT_PUBLIC_MAP_PROVIDER` | Force one: `osm`, `carto-positron`, `carto-voyager`, `maptiler`, `stadia`, `mapbox` |

> OpenStreetMap's tile usage policy applies. For production traffic, set a key for one of the
> commercial providers.

### Routing

| Variable | Default |
| --- | --- |
| `NEXT_PUBLIC_ROUTING_PROVIDER` | `osrm` |
| `NEXT_PUBLIC_OSRM_BASE_URL` | `https://router.project-osrm.org` |

The public OSRM demo server is fine for development; point this at your own instance for production.
Set `NEXT_PUBLIC_ROUTING_PROVIDER=geodesic` to disable road routing entirely.

Never commit `.env.local`. `.gitignore` already excludes it.

---

## 6. Data structure

```ts
Destination {
  id, name, country, countryCode, flag, region, status,
  coordinates, mapView, mapBounds, recommendedDays,
  tags, bestFor, currency, timezone, language, visaNote, originNotes,
  airports: Airport[], areas: Area[], provenance
}

Airport { id, code, name, city, coordinates, role,
          directFromSingapore, flightMinutes, airlines, transfers[] }

Area    { id, destinationId, name, coordinates, isStayBase, zoneType, radiusMeters,
          bestFor[], weakFor[], scores{beach,nightlife,food,luxury,nature,accessibility},
          vibe, summary, idealFor[], priceTier }

Hotel   { id, name, destinationId, areaId, hotelGroup, brand, brandId, coordinates,
          priceTier, priceTierBasis, propertyType, tags[], beachAccess, beachAccessNote,
          airportTransfer, description, loyaltyProgramme, officialUrl?, loyaltyMeta? }

Place   { id, name, destinationId, areaId, category, subcategory, coordinates,
          recommendedDurationMin, bestTime, tags[], description, notes?,
          entryFee?, openingHours?, markerLayer }

Trip    { id, name, destinationId, arrivalDate, departureDate, travellers,
          styles[], budget?, loyalty[], days: TripDay[] }

TripDay { id, index, date, items: ItineraryItem[], note? }

ItineraryItem { id, refId, kind, name, areaId?, lat, lng, durationMin?, note?, confidence }
```

`loyaltyMeta` exists on `Hotel` and is intentionally **empty**. Elite benefits change constantly and
must never be hard-coded; the field is there so a benefits comparison can be added later without a
migration. The same applies to `Trip.loyalty`: the tier is stored as data, and V1 deliberately
claims nothing about what it gets you.

### Data confidence

Every coordinate carries a `DataConfidence`: `verified`, `approximate` or `demo`, plus a free-text
`coordNote` describing what the point actually marks. The UI renders a badge for it on every detail
card. A planner that quietly blends surveyed and estimated positions is worse than no planner.

### Coverage today

| Destination | Status | Areas | Marriott | Hilton | Places |
| --- | --- | --- | --- | --- | --- |
| Bali | reference | 15 | 16 | 5 | 48 |
| Phu Quoc | starter | 4 | 2 | 1 | 8 |
| Da Nang / Hoi An | starter | 4 | 2 | 2 | 8 |
| Ho Chi Minh City | starter | 4 | 3 | 1 | 8 |
| Hanoi | starter | 4 | 2 | 2 | 8 |
| Siem Reap | starter | 3 | 1 | 1 | 8 |
| Phnom Penh | starter | 3 | 1 | 0 | 8 |
| Cebu | starter | 4 | 2 | 0 | 8 |
| Boracay | starter | 3 | 1 | 0 | 7 |
| Palawan | starter | 4 | 1 | 0 | 8 |

**48 areas · 43 loyalty hotels · 119 places · 5 of 119 places marked approximate.**
A zero in the loyalty column is a real finding, not a gap: neither Marriott Bonvoy nor Hilton
Honors has a property we could verify in Phnom Penh, Cebu, Boracay or Palawan. The UI says so rather
than padding the list.

### Adding a destination

```ts
// lib/data/destinations/phuket.ts
export const phuketAreas: Area[] = [ /* … */ ];
export const phuketHotels: Hotel[] = [ /* … */ ];
export const phuketPlaces: Place[] = [ /* … */ ];
export const phuket: Destination = { /* … */ };
```

```ts
// lib/data/index.ts
import { phuket, phuketAreas, phuketHotels, phuketPlaces } from './destinations/phuket';
export const DESTINATIONS = [bali, phuket, ...starterDestinations];
```

The region map, preview card, planner, layer filters, hotel-group filters and efficiency engine all
pick it up automatically. Nothing else changes.

### Adding a hotel

Append to that destination's `Hotel[]`. Set `brandId` to an id from `lib/data/hotel-brands.ts`;
`priceTierBasis` must explain where the tier came from, and it must never be a nightly rate.

### Adding an activity

Append to that destination's `Place[]`. `markerLayer` decides which layer it belongs to
(`activity`, `nature`, `beach`, `food`, `nightlife`, `transport`), which in turn decides its icon,
its shape, its filter chip and its legend entry.

### Adding a whole new marker layer

Add an entry to `LAYERS` in `lib/layers.ts`. The legend, filter toolbar, marker palette and
accessibility labels all read from that list.

---

## 7. Data: what is real and what is not

| Dataset | Status |
| --- | --- |
| **Bali geography** (9 stay areas + 6 excursion zones, airport, 48 places) | Coordinates verified against a bulk Wikidata bounding-box query, the Wikipedia coordinates API and OpenStreetMap element ids. **44 of 48 places resolve to a specific point**; Tegallalang, Jatiluwih, Jemeluk beach and Sunset Road are marked `approximate` with a note saying what the point marks instead. |
| **Bali hotels** (21 properties: 16 Marriott, 5 Hilton) | Every coordinate resolves to the named property in OpenStreetMap, cross-checked against brand-published map links and sourced infobox coordinates. |
| **Other 9 destinations** | Same verification method, but a starter-scope dataset: 2–4 areas, 1–4 loyalty hotels and 7–8 places each. |
| **Airport transfer times (Bali)** | Curated road-time ranges that absorb traffic variance. Not live traffic. |
| **Airport transfer times (other destinations)** | Computed at runtime by the routing provider, so a real road network produces them rather than a number baked into a data file. |
| **Flight durations and carriers** | **Curated sample data**, labelled as such in the UI. Not live schedules. |
| **Price tiers** | Derived from brand positioning and market segment. **Never a nightly rate.** |
| **Room counts** | Only where a citable figure exists; omitted otherwise rather than invented. |
| **Entry fees / opening hours** | Indicative unless a source is named. Every fee string says so. |
| **Bar and beach-club operation** | Not guaranteed. Those notes say *"verify current operation"*, because venues in Bali change hands frequently. |
| **Everything else** | There is no live data anywhere in V1. |

### Corrections the verification pass caught

These are the reason the data layer went through a checking step rather than being written from
memory:

- **Bali has only five Hilton-branded hotels.** There is no DoubleTree, Curio, Tapestry, Canopy or
  Waldorf Astoria trading in Bali (Waldorf Astoria Nusa Dua is announced for 2027). An early draft
  of this dataset contained a DoubleTree that does not exist. It was removed.
- **Siem Reap's airport code is `SAI`, not `REP`** — REP was the old in-town airport, closed in
  October 2023.
- **Phnom Penh moved to Techo International (`KTI`)** in September 2025; the old `PNH` field no
  longer serves commercial traffic.
- **El Nido's IATA code is `ENI`**; "LIO" is only the local airstrip name.
- **Le Méridien Angkor is closed.** Marriott's marketing pages are still live, which is why it is
  widely listed as open. It is excluded here.
- **The former "Cebu City Marriott Hotel" closed in 2018.** Excluded.
- **Four Points by Sheraton Palawan is in Sabang**, about two hours from Puerto Princesa city.

---

## 8. Testing

`npm run test:e2e` drives a real Chromium through the full V1 workflow and asserts on the DOM. It
fails on console errors, uncaught page errors and failed requests, and writes screenshots plus
`test-artifacts/report.json`.

It requires a browser. The script defaults to a Playwright Chromium cache path and can be
overridden with `CHROME_PATH`. Install one with `npx playwright install chromium` if needed.

Coverage: homepage → region map → Singapore origin → destination selection → preview card →
planner → layer toggles → Marriott/Hilton filtering → price tiers → marker → detail card → trip date
generation → add to itinerary → reorder → move between days → day/map emphasis sync → route line →
efficiency panel → transport panel → refresh persistence → mobile layout → **all nine other
destinations load without crashing** → zero console errors.

`npm run validate:data` runs the data-integrity checks (schema, coordinate bounds, duplicate ids,
NaN radii, brand-registry coverage, unknown area references, and a "no price in a description"
assertion) and prints a coverage table. Every check in it exists because the corresponding failure
actually happened during development — a `NaN` area radius crashed Leaflet and blanked the planner.

Notes on the harness: a warm-up phase compiles both routes before asserting, because `next dev`
compiles on first request and can otherwise take longer than any assertion should. Each step has a
hard timeout so one hung action cannot swallow the run.

---

## 9. Known limitations

1. **No prices, at all.** No fares, no nightly rates, no availability. This is a deliberate product
   decision, not an oversight.
2. **No backend and no accounts.** Trips live in `localStorage` on one browser.
3. **Only Bali is deep.** The other nine destinations have enough data to be selectable and to
   demonstrate the architecture; they are not yet good enough to plan a real trip from.
4. **Traffic is not modelled.** Routing gives a normal-traffic drive time.
5. **Efficiency analysis is geometric.** It cannot know that a temple closes at 17:00, or that the
   road to Kintamani washes out.
6. **Area shapes are radius-based**, shown dashed and labelled "approximate extent". We did not
   invent boundaries. Real polygons are a data task, not a code change.
7. **No clustering of the *trip* itself** — a 21-day trip with 60 stops is legal and will render.
8. **Single user, single trip at a time** in the planner's active view (multiple trips are stored
   and switchable, but there is no comparison view).
9. **Photography is absent.** Descriptions and maps carry the product; curated imagery is a V1.1
   concern.
10. **The public OSRM demo server** is rate-limited and not for production.

---

## 10. Recommended next five improvements

1. **Take Bali to full depth on the other nine destinations** — or trim the destination list to the
   four or five that can be done properly. A shallow destination undermines the tool's promise more
   than a missing one does.
2. **Live pricing behind the existing provider interfaces.** The `FlightDataProvider` and pricing
   seams already exist. Ship it as an explicit, attributed *live* layer with a visible timestamp,
   never mixed into the curated data.
3. **Real area polygons** from OpenStreetMap administrative boundaries, so "where should I stay?"
   is answered with actual geography rather than a radius.
4. **Shareable, read-only itineraries.** A trip is already a self-contained JSON object; a signed
   URL or a tiny serverless store would make it collaborative, which is what actually happens when
   people plan a trip together.
5. **Weather and seasonality overlays.** The map already answers *where*; the next most useful
   question for a Singapore-based traveller is *when*. Surf season, monsoon timing and the
   Ramadan/high-season calendar all change the same decisions this product already models.

See `ROADMAP.md` for the full V1 / V1.1 / V2 breakdown.

---

## 4. 路线图（ROADMAP.md）

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

### Destination planner
- Desktop map-first layout with a floating layer toolbar; mobile converts the rail into a
  three-snap bottom sheet.
- Layers: Marriott, Hilton, Activities, Nature, Beaches, Food, Nightlife, Airport, Transport —
  each with a live count.
- Filters: hotel group, price tier, travel style, place category, free-text search. The legend and
  the marker set are produced by the same function, so they cannot disagree.
- Where-to-stay panel with per-area scores, best-for / weak-for, loyalty inventory and price tier.
- Area shapes drawn as dashed "approximate extent" circles, never invented boundaries.

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
- **Real area boundary polygons** from OpenStreetMap administrative data, replacing the dashed
  radius circles.
- **Curated photography**, licensed and attributed, used behind the map rather than instead of it.
- **Opening hours and closure days on the timeline.** A day that ends at Uluwatu after the Kecak
  dance has sold out is an inefficient plan too.
- **Weather and seasonality overlays** — surf season, monsoon timing, and the holiday calendar that
  drives Balinese traffic.
- **Trip comparison.** Two destinations, two area choices, or two hotel bases side by side on
  distance and travel time.
- **Shareable read-only itinerary** via a signed URL. A trip is already a self-contained JSON object.
- **Multi-trip management UI** (list, rename, duplicate, archive) instead of only switching.
- **Automated data validation in CI**: schema, coordinate bounds, duplicate ids, brand-registry
  coverage, and a "no price-like field" assertion.
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
