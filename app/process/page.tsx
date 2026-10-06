import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '制作过程',
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
    file: '40-origin-singapore.jpg',
    title: '出发地是一个实体，不再写死新加坡',
    body: '新加坡只是十一个可选出发城市之一。首页顶栏原来写死"出发地 SIN"，现在它是一个控件：从 新加坡 SIN · XSP ▾。选一个城市，地图、视野、航线、每个时长、直飞筛选和目的地卡片全部跟着变，没有任何一处是为某个目的地写死的代码。',
  },
  {
    file: '41-origin-selector.jpg',
    title: '十一个城市，五个分组',
    body: '新加坡 / 粤港澳大湾区 / 长三角 / 中国其他 / 东南亚。一个城市不等于一个机场：上海有 PVG 和 SHA，北京有 PEK 和 PKX，成都有 CTU 和 TFU，曼谷有 BKK 和 DMK。模型从一开始就存的是一个列表，所以给一个城市加第二个机场是改数据，不是改结构。',
  },
  {
    file: '42-origin-search.jpg',
    title: '搜中文、英文、机场代码都行',
    body: '广州、Guangzhou、CAN 指向同一个地方——这三种写法取决于用户眼前是什么。搜机场代码也会匹配机场中文名，所以 SH A 会同时给出上海和杭州（虹桥、萧山），这是对的：输代码的人要找的就是机场。',
  },
  {
    file: '43-origin-guangzhou.jpg',
    title: '换成广州，整个产品跟着转',
    body: '出发地星标移到广州，视野重新框选，目的地列表里每个时长都变了：巴厘岛从约 2 小时 45 分变成约 5 小时 25 分。直飞筛选现在指的是"从你所在的城市直飞"。长滩岛和巴拉望显示"航班信息待确认"——因为我们确实没有这两条航线的可靠数据。',
  },
  {
    file: '44-origin-route-shanghai.jpg',
    title: '一条连线，从你出发的地方开始',
    body: '上海 → 巴厘岛：约 6 小时 25 分钟 · 直飞 · PVG · SHA → DPS · 待确认。这条曲线只是地理关系示意，不是航路。同一张卡上有数据来源和整理日期——连接数据不能变成没有出处的永久事实。',
  },
  {
    file: '45-origin-unknown.jpg',
    title: '不知道就说不知道',
    body: '雅加达出发，十条航线里我们只整理了三条，其余七条显示"航班信息待确认"，并且不显示任何时长——只给一个明确标注为直线的距离（直线距离 2,815 公里）。这个字段在类型上是 boolean | null，null 表示未知，不等于"没有直飞"。',
  },
  {
    file: '31-zh-home.jpg',
    title: '中文是主语言',
    body: '产品语言是简体中文。这一页的每一个字都来自 lib/i18n 的 546 条词条——zhCN 先写，en 按它的键集做类型约束，所以漏翻一个键是编译错误，而不是界面上冒出一串 key。地名双语并列：读的是"巴厘岛"，搜索时用的是 Bali。',
  },
  {
    file: '32-zh-explore.jpg',
    title: '探索：先看区域，再看地图',
    body: '区域范围是根据该区自己的酒店和景点坐标推出来的凸包——长谷是沿海长条，乌鲁瓦图是悬崖线，而不是一个半径圆。虚线是制图学里"近似"的通用符号。地图一次只画一个范围：九个住宿区，或者六个一日游区域。',
  },
  {
    file: '33-zh-stay.jpg',
    title: '住宿：有照片的排前面',
    body: '巴厘岛 20 家万豪与希尔顿酒店。有实拍照片的排在前面——第一屏全是空占位对用户很不友好。价格只显示定位档位，从不显示房价，每个档位都写明判断依据。',
  },
  {
    file: '34-zh-do-food-canggu.jpg',
    title: '游玩：类别 + 区域，两个筛选一起用',
    body: '十一个中文类别，下面是区域行——只列出当前类别下真的有内容的区域，并带数量。"美食 + 长谷"把 49 家餐厅收敛到 7 家。两个筛选回答的是不同问题：类别是"我想吃什么"，区域是"我愿意开多远"。',
  },
  {
    file: '30-zh-research-inbox.jpg',
    title: '攻略研究：把攻略变成可核实的地点',
    body: '这是一个独立的内部数据层。我们不抓取小红书、抖音、TikTok 的内容——这些平台禁止自动采集，绕过它们的限制不是这个产品会做的事。所以留下链接作为来源，正文由研究者粘贴，界面里直接这样写着。抽取分三轮：先按语料库匹配已知店名，再读"店名：""📍""1."这些攻略真正常用的写法，最后才用受限的启发式。',
  },
  {
    file: '36-zh-plan-transport.jpg',
    title: '行程：餐厅也是行程的一部分',
    body: '餐厅和活动都能加进行程，交通段在每一对停留点之间。模式、实测时长、实测距离在一行，下面写理由和数据来源徽章。没有取到路线的一段就写"暂无路线数据"，整天的时间标记为"约"——不会凭空给一个数字。',
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
    file: '50-zh-import-input.jpg',
    title: '导入攻略 — paste a link or the text',
    body: 'The limitation is stated where the traveller would otherwise expect us to fetch the link, and the link is kept as provenance either way.',
  },
  {
    file: '51-zh-import-review.jpg',
    title: 'The review is on the map',
    body: 'Two candidates found, both plotted. The name is shown exactly as the guide wrote it, next to what Meridian believes it is, with the guide’s own sentence quoted underneath.',
  },
  {
    file: '53-zh-import-resolver.jpg',
    title: 'An unmatched name is never guessed at',
    body: 'Milk & Madu is not in the dataset, so the traveller resolves it: search the canonical places, or create the place as a private submission pending review.',
  },
  {
    file: '52-zh-saved-places.jpg',
    title: '我的收藏',
    body: 'Kept places land in their own scope inside DO, filtered by category, each labelled 来自攻略 with a corpus count rather than a popularity claim — and still on the map.',
  },
  {
    file: '54-zh-import-mobile.jpg',
    title: 'Import on a phone',
    body: 'The sheet expands to full height for the review so the list is readable, and the map above it keeps showing the candidate a card refers to.',
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
  ['Guide extraction', 'Provider interface — deterministic rule-based by default, LLM behind a server route'],
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
    'The import flow takes the panel, not a dialog',
    'The promise is that a guide’s places appear on your map. A modal covering the map would hide the answer at the exact moment it arrives, so the flow swaps the destination side panel and plots candidates as they are reviewed. The first version scoped the preview to the DO tab and drew nothing — the feature has to deliver on the one screen it is about.',
  ],
  [
    'Never scrape, and say so in the interface',
    'Xiaohongshu, Douyin, TikTok and Instagram prohibit automated collection. A scraper breaks monthly, puts a traveller’s own account at risk, and could not be shipped honestly. So the URL is provenance only and the text is what the traveller pastes — stated in words where they would otherwise expect a fetch, rather than buried in a policy page.',
  ],
  [
    'The API key never reaches the browser',
    'Extraction sits behind a GuideExtractor interface. The deterministic rule-based extractor is the default so the feature works offline and for free; the LLM extractor calls our own /api/extract, which is the single place DEEPSEEK_API_KEY or OPENAI_API_KEY is read. On the static build that route is not deployed at all, so the feature degrades instead of breaking and a key in the environment cannot become a key in a bundle.',
  ],
  [
    'A confidence band, never a number',
    'High preselects, medium asks, low does not guess — and the interface says “possibly this place”, not “0.72”. A score invites the traveller to trust a threshold they cannot inspect; a band asks the only question that matters, which is whether we got it right.',
  ],
  [
    'One place, however many spellings',
    'La Brisa, La Brisa Bali and La Brisa Canggu resolve to one canonical record, and saving stores a reference rather than a copy. A second beach club called La Brisa Bali would be worse than not importing the guide at all. For the same reason an unmatched name has no “accept our guess” option — a wrong automatic answer is exactly how duplicate canonical places are born.',
  ],
  [
    'Area boundaries are dashed circles',
    'Real administrative polygons were not available. A dash pattern and an “approximate extent” tooltip say so, rather than drawing a guess as if it were official.',
  ],
];

const BUGS: Array<[string, string]> = [
  [
    'Every mention inherited the whole paragraph’s themes',
    'La Brisa was classified as a temple and credited with a sunset it never had, because the extractor classified a sentence using its parent line. Segmenting to the sentence fixed the attribution — and immediately revealed that “第二天在长谷吃了 Milk & Madu” no longer matched at all, since the restaurant was named without a restaurant word. A visit-verb gate restored it.',
  ],
  [
    'A venue glued to its sentence was never found',
    '「晚上去了蓝房子酒吧」 captured 晚上去了蓝房子 in one greedy run, which the function-word filter then threw away — and because the scan resumed past the match, 蓝房子 was never tried. A guide writing “去了X酒吧” is the common case, not the edge case, so the capture is now trimmed back to the last function word instead of discarded.',
  ],
  [
    'Rendered more hooks than during the previous render',
    '我的收藏 was added to DO as an early return before the component’s remaining hooks, so switching scope changed the hook count and React refused to render. Only the browser suite caught it; the type checker and every unit test were happy. The scope branch now sits after the last hook.',
  ],
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
          <p className="label-caps">制作过程</p>
          <h1 className="mt-3 text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[42px]">
            Meridian
          </h1>
          <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-ink-soft">
            从新加坡出发的东南亚地图行程助手。V1 已经端到端跑通，并且刻意不接入任何实时数据——
            没有实时房价、没有实时机票。地点的坐标来自 OpenStreetMap 或经人工核实，拿不到数据的
            时候会明说，而不是编一个看起来合理的数字。
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

        <Section title="Turning a guide into places on a map">
          <p>
            The core product moment of this iteration is one sentence long:{' '}
            <strong>paste a travel guide, and its places appear on my map.</strong> Everything below
            exists to make that true without inventing anything along the way.
          </p>
          <p>
            <strong>Meridian does not scrape.</strong> Xiaohongshu, Douyin, TikTok and Instagram
            prohibit automated collection, and a scraper would break monthly, put a traveller’s own
            account at risk and still fail on the screenshot that most guides actually are. So the
            link is kept as provenance and never fetched, and the text is what the traveller pastes.
            That limitation is stated in the interface, in words, exactly where a traveller would
            otherwise expect us to read the link: 暂时无法直接读取这个平台的内容。
          </p>
          <p>
            <strong>Extraction is a provider, not a vendor.</strong> A <code>GuideExtractor</code>{' '}
            interface has two implementations. The deterministic rule-based extractor runs in the
            browser, needs no key and costs nothing, and is the default so the feature is
            demonstrable offline. The LLM extractor posts to <code>/api/extract</code> — an internal
            route, and the only place <code>DEEPSEEK_API_KEY</code> or{' '}
            <code>OPENAI_API_KEY</code> is read. The browser calls our route and never holds a
            credential; the static build has no server, so the route is not deployed and the
            deterministic extractor simply runs. The feature degrades rather than breaking, and a
            key in the environment cannot silently become a key in a JavaScript bundle.
          </p>
          <p>
            <strong>Matching refuses to guess.</strong> Names are compared on a loose key (noise
            words stripped) and a strict key (punctuation and accents only), because stripping noise
            destroys names that legitimately contain a region word — Uluwatu Temple among them. Two
            candidates within 0.05 of each other are treated as ambiguous and matched to neither.
            Above the floor the interface speaks in bands: a high-confidence match is preselected, a
            medium one asks, and a low one is reported as unmatched. No score is ever rendered.
          </p>
          <p>
            <strong>The guide’s words stay the guide’s words.</strong> Themes, dishes, warnings and
            times are shown as source-derived, under a line that says so: 以下内容来自攻略，不是
            Meridian 核实过的事实。 A guide saying a beach club is crowded on weekends is useful; it
            is not a verified attribute of the place, and the interface never dresses it as one.
          </p>
          <p>
            <strong>A new place is a submission, not a place.</strong> When the dataset does not hold
            what the guide named, the traveller can place it on the map by hand — which writes a{' '}
            <code>UserPlaceSubmission</code> in <code>pending_verification</code>, private to its
            creator and never written into the canonical registry. It appears in 我的收藏 in its own
            visual register, labelled 待核实, and is never given the card a verified place gets.
          </p>
          <p className="text-muted">
            Signals are aggregates over the traveller’s own saved mentions, and the two corpora —
            你的攻略 and 社区攻略 — are rendered separately and never summed. What it says is “在 N 份
            已收录攻略中被提及”, which is a claim about our own corpus and is checkable. There is no
            popularity ranking anywhere in the product, and a fresh install shows no signals at all
            because there is nothing imported to show.
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
