# FestNest: Product, Market, Startup, and Career Assessment

**Assessment date:** August 14, 2026  
**Application inspected:** `/Users/ashley/code/Festival`  
**Research window:** Current web research, emphasizing 2025–2026 evidence where available  
**Verdict:** **BUILD, BUT CHANGE THE THESIS**

## Executive conclusion

FestNest is a real, technically substantial mobile application, not a wireframe. The repository contains roughly 34,000 lines across the application, components, libraries, and database migrations. It implements guest/email authentication, trip creation and invite joining, nine planning modules, Supabase/PostgreSQL row-level security, realtime subscriptions, offline SQLite paths, a real-dimension campsite grid, encrypted safety profiles, and role-aware collaboration. On August 14, 2026, the checkout passed ESLint and `npx tsc --noEmit`.

The startup thesis, however, is not currently differentiated enough. Rollyn already advertises almost the same “one app instead of group chats, spreadsheets, and multiple tools” proposition for festival crews, including travel, set times, shared packing, expenses, chat, and offline festival data. Cht.so offers a no-install festival room with arrivals, supplies, rides, meetups, artists, polls, chat, and costs. FestiPlannr, FestiView, Amicorum, kndi, Appic, Setline, Festival Dust, Mela, and official festival apps cover schedules, clashes, groups, maps, offline access, and friend coordination. FestiView and Flaresat already offer the proposed off-grid/Meshtastic direction, while CrowdLink, Truss, Crowd Compass, CrowdHop, FestivAir, and Loxation attack the same no-signal problem. A dedicated consumer campsite-layout simulator also exists.

The remaining opportunity is narrower: **a collaborative, real-dimension camp-setup and ownership workflow for serious camping-festival crews, producing an offline-ready “festival packet” that gets the whole camp from planning to setup.** That combines the strongest implemented feature—the camp grid—with supply ownership, arrivals, emergency readiness, and offline operation. I found evidence of users drawing layouts by hand, using The Sims or home-design tools, asking whether equipment will fit, and building shared inventory spreadsheets. I did not find evidence that this narrower workflow has a scaled category winner. That is a plausible workflow/UX gap, but it is not yet evidence of a large standalone company.

As a career project, FestNest is stronger than its startup outlook. Current resume value is **6.5/10**: the code demonstrates breadth and several nontrivial engineering decisions, but there is no verified public deployment, no meaningful automated test suite, no observability/analytics stack, no proven user metrics, and the web export currently fails. Properly productionized and used by real festival crews, it could reach **9/10** as a mobile/full-stack portfolio project. It currently provides little direct applied-AI signal because no LLM, agent, retrieval, model evaluation, or AI reliability system is implemented.

---

## Evidence rules and limitations

- **Repository fact** means verified directly in the current checkout.
- **Market fact** means supported by a linked current source.
- **Inference** means my judgment based on repository and market evidence; it is not presented as a measured fact.
- Public competitor pages do not reveal every feature. “Not observed” means the feature was not advertised or documented in the sources reviewed, not that it definitively does not exist.
- No App Store/Play Store release, EAS deployment configuration, production analytics, revenue, or user-count evidence was found in the repository. This does not prove that private traction does not exist; it means it cannot be credited in this assessment.
- A live web UI inspection was attempted. The static web export failed in `react-native-maps` with `codegenNativeComponent is not a function`. Native device QA is documented in the repository, but a current native build was not independently run in this assessment.

### Current implementation evidence

| Area | What is verified |
|---|---|
| Product | Expo/React Native app with auth, trip dashboard, invites, and nine domain modules |
| Backend | Supabase Auth, PostgreSQL schema/migrations, 55 RLS policies across migrations, and realtime subscriptions in nine hook files |
| Offline | SQLite used for camp grid, safety, and packing; camp-grid save protects against destructive overwrite after remote-load failure |
| Security | AES-256-GCM safety-field encryption, device-held keys in Secure Store, PIN-based emergency payload, RLS and role checks |
| Quality | ESLint and TypeScript pass; GitHub Actions runs lint only |
| Testing gap | One encryption script and extensive manual QA notes, but no configured unit, integration, end-to-end, or database-policy test suite |
| Production gap | No verified app-store release, public deployment, EAS pipeline, crash reporting, analytics, or production SLOs |
| Runtime issue | Expo web export fails through `react-native-maps`; web support should not be claimed as working |
| AI | No LLM/agent/model integration is implemented |

Important local evidence: `package.json`; `app.json`; `lib/sqlite/useCampGridDB.ts`; `lib/crypto/safetyEncryption.ts`; `lib/hooks/useSafetyProfile.ts`; `supabase/migrations/`; `.github/workflows/lint.yml`; `docs/test-notes.md`; `docs/product/feature-completion.md`.

---

# Part 1 — Explain the product

## What the application actually does

FestNest is a mobile workspace for a group attending a multi-day camping music festival. One person creates a trip, invites the crew, and coordinates the physical campsite, supplies, food, rides and flights, artist schedules, personal packing, emergency information, and shared expenses. Members can claim items, vote on artists, join vehicles, see updates, and work with role-based permissions. Several critical modules are designed to work offline because festival connectivity is unreliable.

## Primary user

The best primary user is **the organizer of an 8–30-person crew attending a multi-day car-camping festival**—the person who currently owns the spreadsheet, asks who is bringing the canopy, reconciles arrival times, and sketches how cars and tents will fit.

Secondary users are invited crew members who claim equipment, record travel details, vote on sets, and check what to do next. “Every festival attendee” is too broad: the value is much weaker for solo attendees, day-festival attendees, couples, and groups that do not camp.

## Problem being solved

Festival crew logistics are fragmented across group chat, spreadsheets, notes, screenshots, maps, lineup tools, and expense apps. Important decisions get buried, responsibilities remain ambiguous, and connectivity becomes unreliable at the moment the group needs current information.

## Core value proposition

**Give a camping-festival crew one shared, offline-ready plan that shows what fits, who brings what, how everyone arrives, and what the group is doing.**

## Current differentiator

The most credible current differentiator is not “all-in-one festival planning.” Rollyn and cht.so already make that claim. The current differentiator is the combination of:

1. A real-world-dimension, drag-and-drop campsite grid.
2. Shared supply ownership and packing state connected to the same trip.
3. Offline/local persistence for camp and safety data.
4. Festival-specific collaboration and permissions rather than a generic itinerary.

## Potential long-term differentiator

The strongest long-term differentiator would be **the canonical operational model for a camping-festival group**: verified festival campsite presets; reusable gear inventories with exact dimensions; an AI-assisted ingestion pipeline for lineup posters, confirmation screenshots, and festival rules; resilient offline group sync; and organizer-distributed trip templates. The moat would come from structured festival/gear data, repeat group history, distribution partnerships, and reliability—not from having more checklist modules.

Mesh messaging is not a credible proprietary differentiator by itself. FestiView already sells Meshtastic support; Flaresat offers cross-platform cloud/LoRa group mapping and says it has 1,000+ users; several 2025–2026 projects offer BLE or LoRa festival communication ([FestiView](https://www.festiview.com/), [Flaresat](https://flaresat.com/), [CrowdLink](https://fionan313.github.io/CrowdLink/), [Truss](https://www.truss.one/), [Crowd Compass](https://www.crowdcompass.io/)).

## Category

- Vertical consumer collaboration software
- Group-trip/festival planning
- Event companion software
- Offline-first mobile productivity
- Potential B2B2C festival operations/attendee platform if expanded

> **The core bet this product is making is: camping-festival crew organizers and members will adopt a dedicated shared workspace—and return for later festivals—because a festival-specific operational plan is materially better than their existing group chat, spreadsheet, official app, and Splitwise stack.**

---

# Part 2 — Competitive landscape

## Competitor matrix

| Product | What it does / target | Key features | Price / traction evidence | Similarity | What it has that FestNest lacks | What FestNest has that it does not publicly show | Thesis impact | Threat |
|---|---|---|---|---|---|---|---|---|
| **Rollyn** | All-in-one festival/rave trip app for crews | Travel/lodging, set times, shared packing, expenses, chat, moodboards, maps, offline loading, polls, referrals | Free; iPhone; 4.9/5 from 42 ratings in current US App Store; frequent 2026 updates ([App Store](https://apps.apple.com/us/app/rollyn-festival-rave-app/id6759700821)) | Very high | Built-in chat, lodging/confirmation uploads, moodboards, event discovery, QR joining, active App Store distribution, current user reviews | Real-dimension camp grid; encrypted emergency profile; Android intent; deeper roles/approval model | Invalidates the broad “all festival logistics in one app” thesis | **Existential** |
| **cht.so Festival Group Planner** | Browser-based room for groups planning a festival or other event | Chat, arrivals, camping lists, rides, meetups, artists, music queue, polls, expenses, photo wall | Free; no install/account for guests; public traction not found ([product](https://www.cht.so/festival-group-planner), [home](https://www.cht.so/)) | Very high | Zero-install link, chat, polls, playlist, photo wall, multi-currency, broader event use cases | Real-scale camp grid; native offline local data; safety encryption; festival presets | Invalidates “replace scattered group tools” as unique; sets a much lower adoption-friction benchmark | **High** |
| **FestiPlannr** | Festival schedule and group coordination | Offline festivals, schedule conflicts, live group heatmaps, map pin, weather, flight data, notifications, wallpaper export | Free iPhone app; 4.4/5 from 8 ratings; launched on Product Hunt in 2024 and native app in May 2026 ([App Store](https://apps.apple.com/us/app/festiplannr/id6762166101), [Product Hunt](https://www.producthunt.com/posts/festiplannr)) | High in lineup/live planning | Current festival catalog, richer schedule UX, weather, flight discovery, visual schedule export | Camp layout, supplies, meals, packing, budget, safety | Invalidates schedule/group/offline/weather differentiation; also exposes festival-data coverage as an operational bottleneck | **High** |
| **FestiView** | Premium iOS festival companion for crews | Offline lineup, conflicts, chat, live map, UWB precision finding, Dynamic Island, iCloud sync, optional Meshtastic, planned post-festival recap | $2.99/festival; $9.99 mesh unlock; iOS 26+; claims Coachella 2025 battery test ([site](https://www.festiview.com/)) | High during the festival | UWB, lock-screen UX, live friend map, chat, polished timeline, privacy architecture, working Meshtastic product claim | Pre-trip camp grid, supplies, food, travel capacity, budget, safety record | Directly invalidates mesh/no-signal as a future differentiator | **High** |
| **Flaresat** | Cross-platform live team map for any low-coverage field setting | iOS/Android/web, no-account group links, chat, pins, routes, geofences, weather, Meshtastic/MeshCore, cloud-to-radio bridge | Free; site claims 1,000+ users ([site](https://flaresat.com/), [Google Play](https://play.google.com/store/apps/details?id=com.flaresat.app)) | Medium; high for live-mode roadmap | Mature live map/mesh scope, hardware integrations, cross-platform web | Festival prep, camp layout, lineup, packing, food, budget | Invalidates live map/mesh as defensible; could expand into festival crews | **Medium–High** |
| **Wanderlog** | General collaborative leisure-trip planner | Shared itinerary/maps, reservations, budgets, attachments, route optimization, offline Pro, Gmail imports, AI assistance | Free; Pro from $39.99/year; YC W19; disclosed $1.5M seed ([pricing](https://wanderlog.com/pro), [funding](https://wanderlog.com/blog/2021/09/01/announcing-our-seed-fundraise/), [YC](https://www.ycombinator.com/companies/wanderlog)) | Medium | Mature maps/itinerary/imports, AI, destination content, brand and distribution | Festival-specific campsite/lineup/safety workflows | Shows general travel collaboration can work, but raises quality and acquisition expectations | **Medium** |
| **Appic / official festival-app platforms** | Festival discovery and official attendee experience | Tickets, official schedules, personalized timetable, event map, friend location, recommendations, loyalty, alerts | Appic says 1.5M+ fans; free attendee app ([App Store](https://apps.apple.com/in/app/appic-festivals-more/id968362389)); Aloompa provides organizer CMS/apps ([Aloompa](https://go.aloompa.com/)) | Medium | Authoritative data, organizer distribution, tickets, alerts, maps, sponsor/loyalty surfaces | Crew-owned pre-trip logistics, camp equipment planning, independent cross-festival history | Official data/distribution can neutralize the lineup and map wedges; incumbents can add crew features | **High** |
| **Campsite Layout Simulator** | Consumer tool for testing whether tents, tarps, cars, and equipment fit a campsite | Configurable plot and gear layouts; visual size comparison | Free with IAP; Japanese iPhone/iPad app; 4.2/5 from 36 ratings ([App Store](https://apps.apple.com/jp/app/%E5%A6%84%E6%83%B3%E3%82%AD%E3%83%A3%E3%83%B3%E3%83%97-%E3%82%AD%E3%83%A3%E3%83%B3%E3%83%97%E3%82%B5%E3%82%A4%E3%83%88%E3%83%AC%E3%82%A4%E3%82%A2%E3%82%A6%E3%83%88%E3%83%AC%E3%83%BC%E3%82%BF%E3%83%BC/id1557008556)) | High for hero feature, low overall | Focused layout UX and existing consumer validation | Collaboration, festival presets, bring-list ownership, trip operations, safety | Proves the layout function is not unprecedented, but not the combined workflow | **Medium** |
| **WhatsApp/iMessage + Google Sheets/Docs + official app + Splitwise** | The incumbent workaround assembled from tools users already have | Familiar chat, flexible spreadsheet, authoritative lineup/map, mature expense splitting | Mostly free; no new install if already used; Splitwise says it is trusted by millions ([Splitwise](https://www.splitwise.com/offer)) | High at the job level | Habit, flexibility, interoperability, zero new category education | Unified state, camp geometry, clear ownership, festival-specific offline packet | The default competitor and likely largest cause of non-adoption | **High** |

## Biggest threats and bilateral choice

### 1. Rollyn — existential to the broad thesis

**Why a customer chooses Rollyn:** It is already distributed in the App Store, looks active, has user reviews, and covers almost the same jobs with built-in chat, lodging, confirmation uploads, moodboards, event discovery, official set-time/map experiences, and offline loading. Its current messaging is effectively FestNest’s broad positioning.

**Why a customer chooses FestNest:** Only if the campsite grid, exact equipment fit, shared ownership, stronger Android access, safety/offline data, or organizer controls solve a real need that Rollyn does not. Without demonstrating that those features are indispensable, there is not yet a strong reason to choose FestNest.

### 2. The incumbent tool stack — highest practical threat

**Why a customer chooses the stack:** Everyone already has chat and spreadsheets; the official app has current data; Splitwise handles money. A dedicated festival app asks the organizer to migrate information and persuade every friend to install or join.

**Why a customer chooses FestNest:** If setup begins from a festival preset, a lineup poster, and a reusable gear inventory; if invitees can contribute in seconds; and if FestNest produces a materially better camp setup and offline packet. Today that 10× advantage is not proven.

### 3. FestiView — high threat to the live/offline vision

**Why a customer chooses FestiView:** Polished iOS-native schedule, UWB friend finding, chat, lock-screen surfaces, privacy, offline behavior, and optional Meshtastic for a small per-festival price.

**Why a customer chooses FestNest:** FestNest is better before arrival: physical camp design, supplies, food, travel, budget, and safety. For the live festival experience alone, FestiView currently has the clearer value proposition.

### 4. FestiPlannr — high threat to schedule/group planning

**Why a customer chooses FestiPlannr:** It already downloads festival data, shows group heatmaps and schedule conflicts, adds weather/flight data, and exports a useful wallpaper. A review explicitly says group schedules change how the crew plans.

**Why a customer chooses FestNest:** A camping crew that needs more than the schedule may prefer one operational workspace. However, FestiPlannr’s own coverage complaint shows that maintaining authoritative festival data is hard; FestNest currently has even less evidence of a scalable ingestion process.

### 5. cht.so — high threat through lower friction

**Why a customer chooses cht.so:** One browser link, no app install, and nearly the full group-event coordination feature set for free.

**Why a customer chooses FestNest:** Native offline support, structured festival modules, campsite geometry, and encrypted emergency information. FestNest must prove those benefits exceed the cost of installing and learning another app.

---

# Part 3 — Is there actually a market gap?

## Finding

The broad gap—“one place for festival groups to plan”—is **already being filled**. The narrower gap—“collaborative, dimension-aware camp setup plus responsibility ownership and offline execution”—appears **poorly solved and fragmented**, not untouched.

| Gap type | Assessment |
|---|---|
| Genuinely unsolved problem | No, not at the broad festival-planning level |
| Poorly solved problem | Yes: group adoption, authoritative data coverage, offline reliability, and campsite setup remain inconsistent |
| Workflow gap | Yes: physical camp layout is separated from gear ownership, arrival order, and offline setup instructions |
| UX gap | Yes: official apps and generic tools often make clashes, maps, and group planning awkward |
| Technical gap | Modest: resilient offline multi-user state is hard, but multiple products already implement parts of it |
| Distribution gap | Yes: organizer/festival distribution could eliminate the “convince everyone to install” problem |
| Pricing gap | Possible: per-trip group purchase may fit occasional usage better than annual subscriptions |
| Niche too small | A serious risk if limited only to US camping-festival campsite layout |
| No meaningful gap | Incorrect; there is observed pain, but the gap is narrower than the current product scope |

## Evidence of actual pain and workarounds

- A 2026 festival-camping organizer shared a customizable Google Sheet with separate camp, kitchen, car, medical, and grocery tabs; commenters found it useful ([Reddit](https://www.reddit.com/r/LightningInABottle/comments/1s0fvx4/camping_with_a_group_try_out_my_group_camping/)).
- Current festival threads ask whether specific cars, tents, and canopies fit fixed plots and recommend drawing dimensions, setting equipment up at home, or using The Sims/home-design software ([Lost Lands layout request](https://www.reddit.com/r/LostLandsMusicFest/comments/1lh2pmx), [Dancefestopia Sims workaround](https://www.reddit.com/r/Dancefestopia/comments/1tk24ob/car_camping_layout/), [Electric Forest layout discussion](https://www.reddit.com/r/ElectricForest/comments/1u8e655/preferred_car_camping_layout/)).
- A 2025 official festival-app complaint thread objected to an unreadable schedule and missing clash visibility; users preferred Clashfinder or community-built alternatives ([Reddit](https://www.reddit.com/r/downloadfestival/comments/1kljnqs)).
- Festival users repeatedly report that apps and cellular service fail in dense crowds; others question battery drain and recommend predetermined meetup spots ([Reddit](https://www.reddit.com/r/festivals/comments/1s1z1t0/lost_my_group_at_every_festival_ive_ever_been_to/)).
- FestiPlannr’s strongest current review praises group scheduling but says many festivals were unusable because set times were not maintained. This is evidence of pain and also a warning about the data-supply burden ([App Store](https://apps.apple.com/us/app/festiplannr/id6762166101)).

## Nobody built it vs. nobody wants it enough

“Nobody has built this” is false. Multiple teams have built almost every component and at least one product—Rollyn—has built the broad bundle.

“Nobody wants it badly enough” is not proven, but the category has warning signs. Travel planning is low-frequency and competes with good-enough manual tools. A 2025 HN founder described building a polished collaborative AI travel app before validating and called the space a saturated “tarpit” ([HN](https://news.ycombinator.com/item?id=44032047)). Earlier travel founders reported that low frequency and expensive reacquisition hurt them; TouristEye reached hundreds of thousands of registered users but saw low usage ([HN discussion](https://news.ycombinator.com/item?id=8419658)). Troupe, launched by JetBlue Travel Products, appears defunct in 2026 despite a well-regarded group-planning flow ([status summary](https://tripti.ai/blog/rip-troupe-what-to-use-now)). Triposo shut down in 2023. These cases do not prove FestNest fails, but they show that visible pain does not automatically create retention or a large business.

## Market-gap score: **4.5/10**

Reason: Pain and workarounds are real, and the camp-operations workflow is not well consolidated. But the claimed all-in-one differentiation is directly duplicated; no-signal, group scheduling, maps, and campsite layout have all been built; frequency is seasonal; and willingness to pay is uncertain. This is a real but modest opportunity until live pilots prove otherwise.

---

# Part 4 — User need and product-market fit

## Strongest initial segment

**Crew leaders for 8–30-person groups attending multi-day car-camping electronic/jam festivals with fixed campsite dimensions.** Start with a small cluster such as Electric Forest, Lost Lands, Elements, and Dancefestopia, where gear coordination and plot layout are consequential.

## Need profile

| Question | Judgment |
|---|---|
| Who feels it most? | The group organizer, camp lead, or logistics-heavy veteran; much less than ordinary members |
| Frequency | Intensive for 2–8 weeks before each festival, live for 3–5 days, then dormant; often 1–4 times/year |
| Pain | Moderate overall; high for large first-time groups or tight fixed plots |
| Current alternatives | Group chat, Sheets/Docs, paper sketches, home-design tools/The Sims, official app, Clashfinder, Splitwise |
| Value saved | Primarily frustration, coordination labor, duplicate purchases, forgotten gear, and setup risk; limited direct monetary savings |
| Vitamin or painkiller? | Vitamin for average attendees; painkiller for the crew organizer during a complex camping trip |
| Search intent | Users search for packing lists, campsite dimensions/layouts, set times, maps, and “what fits,” not necessarily “festival operating system” |
| Willingness to pay | Likely low for each member; more plausible for the organizer as a one-trip pass or for the festival/brand partner |
| Plausible price | Free attendees; $7.99–$14.99 per group trip, or $19.99–$29.99/year for crew leaders; partner pricing must be validated |
| Acquisition difficulty | High without festival partnerships or creator/community distribution; seasonal SEO/social content could help |
| Churn causes | Event ends, friends do not contribute, official data is missing/late, setup takes too long, group returns to chat, app fails offline |
| Usage cadence | Weekly before event, daily in final week, multiple times/day onsite, then dormant |

## Activation event that matters

Do not count downloads. An **activated group** should meet all of these:

1. Organizer creates a trip from a festival preset.
2. At least three other members join.
3. Two or more non-organizers contribute data.
4. The group saves either a camp layout or a bring-list with assigned owners.
5. At least one member opens the offline packet during the event window.

If groups do not reach this state, the product has not displaced the incumbent workflow.

---

# Part 5 — Startup analysis

## Bottom-up market framing

Live music is large: Live Nation reported 159 million fans across 55,000 events and 131 festivals globally in 2025 ([2025 10-K](https://investors.livenationentertainment.com/sec-filings/annual-reports/content/0001335258-26-000009/lyv-20251231.htm?TB_iframe=true&height=auto&preload=false&width=auto)). Those figures are **not** FestNest TAM: they include concerts, repeat attendance, non-camping events, and markets where FestNest may not operate.

### Realistic consumer serviceable market — inference range

A defensible planning range is:

- 3–8 million annual attendee-trips at relevant multi-day camping festivals across initial English-speaking markets.
- 50–75% arrive as coordinated groups.
- Average coordinated group size: 5–8.
- Result: roughly **250,000–1.2 million relevant group trips/year**.
- If the group-level realized revenue is $8–$20, the direct consumer revenue pool is roughly **$2M–$24M/year** before considering adoption.

This is a sensitivity range, not a measured market-size fact. It suggests a legitimate niche software business but does not independently support a venture-scale outcome.

### Initial obtainable market

Five target festivals × 15,000–50,000 camping attendees × 60% group travel ÷ six people/group produces roughly 7,500–25,000 target group trips/year. Winning 3–8% after focused community distribution yields 225–2,000 activated groups. At $10–$15 realized revenue/group, that is only $2,250–$30,000 consumer revenue. The initial wedge is valuable for validation, not large on its own.

## Business model recommendation

1. **Free member participation.** Charging every invitee would destroy group activation.
2. **Group trip pass:** $9.99–$14.99 paid by the organizer for camp-grid export, reusable gear inventory, offline packet, and advanced collaboration.
3. **Leader annual plan:** $24.99/year for repeat festival crews; do not make this the only choice because usage is seasonal.
4. **Festival/brand partnership:** paid templates, verified campsite presets, official rules/data, and co-branded onboarding. Pricing must be discovered in pilots.
5. **Later transaction/affiliate revenue:** camping gear or ticket/lodging referrals only after trust and usage exist; avoid turning safety/packing advice into a shopping feed.

## Economics and scalability

| Dimension | Assessment |
|---|---|
| Gross margin | Software margin can be 75–90%, but manual festival-data operations and partnership support can materially reduce it |
| Scalability | Technical stack can scale reasonably through Supabase, but data freshness, support, and seasonal spikes need engineering and operations |
| Network effects | Weak group-local effects: the app becomes useful when friends join; little cross-group network value today |
| Data advantage | None yet; possible through gear dimensions, campsite presets, layout outcomes, and festival-specific operational templates |
| Switching costs | Low today; moderate after reusable gear inventory, group history, and trusted templates accumulate |
| Defensibility | Low; features are replicable and competitors already overlap |
| Distribution | Hardest problem; organizer partnerships, subreddit/Discord leaders, festival creators, and gear communities are the plausible routes |
| CAC | Likely too high through paid consumer ads; must be driven by organizer-to-member invitations and community/partner acquisition |
| Retention | Seasonal and event-based; annual retention depends on repeat festival attendance and group reuse |
| Regulatory risk | Moderate around medical/safety data, precise location, youth users, privacy, and account deletion obligations |
| Platform risk | Apple/Google policies, background location rules, push notifications, maps billing, and app-store distribution |
| API/data risk | Supabase, map SDK, future weather/flight/music APIs, and unofficial lineup imports; authoritative schedules may be licensed or late |
| Foundation-model dependency | None today; future AI ingestion should be provider-abstracted and verified because model errors could corrupt schedules/rules |
| Ease of replication | High for lists, votes, budgets, chat, and schedules; medium for a reliable offline multi-user camp workflow |
| Incumbent copy risk | High. Rollyn or official apps could add a camp checklist/layout; Flaresat/FestiView already own parts of live/offline mode |

## Low, base, and high outcomes

These are scenario models, not forecasts.

| Case | Operating outcome | Plausible annual revenue |
|---|---|---:|
| Low | Good portfolio app; 500–2,000 activated groups/year; negligible paid conversion; no partner deals | $0–$10K |
| Base | Recognized niche product; 20K–40K activated groups; 5–10% buy a $10–$15 pass; 5–15 small partner contracts | $50K–$250K |
| High | Leading camping-festival operations product; 150K–300K groups; strong group-paid conversion; 50–100 organizer/brand partners; some referral revenue | $1M–$4M |

Even the high case is a good small company, not automatically venture-scale. Venture scale would require expansion into an organizer-distributed operating platform, outdoor/group-event operations, or meaningful transaction volume—probably $20M+ annual revenue potential with a credible path to $100M, not merely more consumer checklist features.

## Venture-scale judgment

**Current form: no.** The direct consumer niche, low frequency, weak moat, and high acquisition friction do not support venture-scale confidence.

**Expanded B2B2C platform: plausible but difficult.** A credible large company would need authoritative event operations data, organizer distribution, resilient onsite coordination, reusable group/gear identity, and monetization beyond a low-price subscription.

---

# Part 6 — YC / accelerator evaluation

YC says more than 10,000 companies apply every three months and its typical acceptance rate is about 1%; it also says 40% of funded companies are only an idea, so lack of revenue is not itself disqualifying ([YC investor page](https://www.ycombinator.com/investors), [YC FAQ](https://www.ycombinator.com/faq/)). The relevant standard is evidence that people want the product: YC’s own essentials emphasize launching, talking to users, and finding 10–100 customers who love it ([YC advice](https://www.ycombinator.com/blog/ycs-essential-startup-advice/)).

| YC question | Skeptical partner view |
|---|---|
| Would it get attention? | The real-scale camp grid, offline requirement, and deeply specific festival-crew workflow could earn a second look |
| Interesting part | Founder shipped a broad working product and understands field constraints; camp setup is tangible and visual |
| Worrying part | Direct clone-like overlap with Rollyn; no verified users/retention/revenue; feature breadth without proven wedge; seasonal niche |
| Compelling problem? | Compelling for the organizer, moderate for everyone else |
| Large market? | Not clearly in current form |
| Feature or company? | Currently a feature bundle / niche product; company only if the camp-operations wedge creates distribution and expands |
| Obvious wedge? | Real-dimension camp setup + bring ownership + offline execution for large camping crews |
| Can wedge expand? | Yes, to reusable group/gear graph, organizer templates, onsite coordination, and broader outdoor/group-event operations |
| Founder insight? | Some: offline needs, fast invites, responsibility ownership, destructive-sync protection. Missing: documented user discovery and behavior data |
| Traction that changes view | 100+ activated groups across 3+ festivals; 40%+ invite acceptance; 50%+ non-organizer contribution; 30%+ repeat next-festival use; 20+ paid group passes; 2 organizer pilots |
| Likely rejection cause | “Rollyn already does this,” no active users, no focused wedge, consumer seasonal market, and no reason the organizer can distribute it cheaply |

**Estimated chance of receiving a YC interview if submitted today: 0.5%.** Assumptions: no verified traction or revenue is included, the applicant communicates the current broad thesis, and the comparison set includes Rollyn and other current apps. This is below the already-selective applicant baseline.

**Estimated chance after recommended milestones: 6%.** Assumptions: at least 100 genuinely activated groups at three festivals, strong contribution and event-window usage, 20+ paying group leaders, two organizer/community distribution pilots, and a crisp camp-operations thesis. Six percent is still a long shot but meaningfully above baseline because the application would contain behavior, not just features.

## Best organizational fit

| Path | Fit |
|---|---|
| Bootstrapping | **Strong** |
| Indie SaaS / seasonal consumer product | **Strong** |
| Small profitable company | **Plausible** |
| Accelerator | **Plausible after traction** |
| Venture-backed startup | **Weak today** |
| Open-source project | Useful for offline-sync credibility, but weak for consumer distribution unless paired with a hosted product |
| Portfolio project | **Excellent potential** |

---

# Part 7 — What is the bigger version?

## Expansion path

**Current application**  
Camping-festival group planner with camp grid, supply ownership, travel, lineup, safety, and budget

→ **Logical expansion #1: Festival Crew Operations**  
Verified campsite presets; reusable gear library; arrival-order setup plan; offline trip packet; organizer/crew templates; lineup/rules/confirmation ingestion; live change reconciliation

→ **Expansion #2: Organizer-distributed Group Experience Platform**  
Festivals provide official maps, lot dimensions, schedules, safety notices, and group templates; crews coordinate privately; organizers get aggregate operational signals without accessing private group content

→ **Potential platform/company: Offline Group Operations for Temporary Events**  
A group operating layer for festivals, large camps, rallies, tailgates, outdoor gatherings, and other temporary low-connectivity events, with verified site data, logistics, safety, and resilient coordination

## Strongest larger company

The strongest version is **not “Wanderlog for festivals” and not “AI festival planner.”** It is an organizer-distributed, offline group-operations layer that turns official event data and a crew’s equipment/people into an executable plan. The consumer app becomes the field client; the scalable company sells distribution, data tooling, and operational reliability.

**Vision rating: Plausible but difficult.** The expansion is adjacent to the current architecture and problem, but it requires a different go-to-market motion, enterprise reliability, data rights, privacy discipline, and proof that organizers will pay or distribute it.

---

# Part 8 — Career and resume value

## Separate judgment from startup viability

A product can be a weak venture opportunity and an excellent engineering artifact. FestNest already contains more engineering breadth than most portfolio CRUD apps. The weakness is not lack of code; it is lack of independently verifiable production evidence.

## Audience reaction

| Audience | Likely current reaction |
|---|---|
| Software engineering recruiters | Positive if described concretely; may discount it without a live demo and metrics |
| Senior engineers | Interested in offline sync and encryption, but will probe tests, key recovery, conflicts, RLS verification, and failure modes |
| Engineering managers | Good evidence of scope ownership and shipping; weak evidence of production operations and team collaboration |
| Startup founders | Strong “builder” signal; will ask about users, iteration, and why so many modules were built before validation |
| AI companies | Limited AI signal; useful product/full-stack signal only |
| Applied AI teams | Currently weak fit unless an evaluated AI ingestion/reliability subsystem is added |

## Technical scorecard

| Area | Current score / 10 | Reason |
|---|---:|---|
| Technical difficulty | 7.0 | Offline/local/cloud logic, encryption, maps, permissions, and realtime are nontrivial |
| Originality | 4.5 | Product bundle and roadmap substantially overlap current apps; camp workflow is more distinctive |
| Architecture complexity | 7.0 | Typed screens/hooks, Supabase, RLS, realtime, SQLite, Secure Store, multiple domain models |
| AI integration | 0.5 | No implemented LLM/agent/model system |
| Backend sophistication | 6.5 | Real schema, migrations, RLS, realtime; no separate service layer, workers, queues, or operational tooling |
| Frontend sophistication | 7.0 | Many native screens, modals, gestures, maps, landscape grid, design tokens |
| Production engineering | 3.5 | No verified release, crash reporting, analytics, deployment pipeline, or SLOs |
| Scalability | 4.5 | Managed backend helps, but no load evidence, indexing analysis, rate limits, or capacity tests |
| Data engineering | 3.5 | Strong domain schema; no ingestion pipeline, provenance, data quality, or warehouse/analytics |
| Agent/LLM engineering | 0.0 | Not present |
| Testing | 2.5 | Manual QA and one script; no meaningful automated suite |
| Observability | 1.0 | Console errors only; no analytics/error monitoring found |
| Security | 6.0 | Encryption and RLS are meaningful; no policy tests, audit, threat model, recovery story, or production validation |
| Deployment | 2.0 | App configuration exists; release is unverified and web export fails |
| UX | 6.0 | Thoughtful design system and documented device QA; current live UI could not be independently inspected |
| Evidence of shipping | 6.0 | 39 commits and broad working code; production/user shipping is unproven |

## Resume scores

- **Current resume value: 6.5/10**
- **Potential resume value if properly completed: 9/10**

## What must exist for “this person can build real software”

1. Public App Store/TestFlight or working web/native demo with a frictionless sample trip.
2. A reproducible CI pipeline running lint, TypeScript, unit tests, integration tests, migration/RLS tests, and at least one end-to-end flow.
3. Error monitoring, product analytics, structured logs, release/version tracking, and a small operational dashboard.
4. A tested offline-sync contract: versioned records or operation log, conflict policy, retry/idempotency, and deterministic failure tests.
5. Security evidence: threat model, key lifecycle/recovery explanation, privacy/account deletion flow, and tested RLS policies.
6. Real usage evidence: activated groups, invite conversion, non-organizer contributions, offline event opens, bugs found/fixed, and retention.
7. For AI roles: a real evaluated AI system—e.g., lineup-poster and festival-rule extraction with schemas, provenance, confidence, human approval, test corpus, error taxonomy, and model/provider fallback.

## Impressive-sounding but low-signal features

- “Nine modules” without evidence that users use them.
- Generic AI chatbot or packing-list generator with no evaluation.
- More static settings screens.
- Weather card, simple notifications, or cosmetic themes.
- “Real-time” as a resume word without explaining subscriptions, consistency, retries, and conflict behavior.
- “End-to-end encrypted” without a defensible key-sharing/recovery and threat model. The owner-key model protects server data but also limits cross-device/profile access; interviewers will probe it.

## Unusually strong hiring signal

- Deterministic offline/online reconciliation under packet loss, stale state, and concurrent edits.
- Property-based tests for budget settlements and camp-grid geometry/collision constraints.
- RLS policy test harness proving unauthorized reads/writes fail across all roles.
- AI document/lineup ingestion with measured precision/recall, provenance, and approval gates.
- Production incident write-up showing detection, diagnosis, rollback/fix, and prevention.
- Real user telemetry connected to product changes and measurable activation improvement.

---

# Part 9 — Interview value

## Stories already available

1. **Offline camp grid and destructive-save protection:** Why local drafts exist, how remote state is verified, why a failed remote read must block deletion, and how the UX communicates risk.
2. **Safety encryption and PIN rehydration:** AES-GCM, device-held keys, PIN-derived emergency payload, stale-cache behavior, and the reliability fixes for missing local rows/PIN rotation.
3. **RLS plus client role enforcement:** Defense in depth, membership checks, leader/editor/viewer behavior, and where policy tests are missing.
4. **Realtime module architecture:** Subscriptions across supplies, meals, lineup, budget, travel, activity, collaboration, and packing; cleanup and stale state.
5. **Budget settlement:** Integer cents, equal/custom splits, debtor/creditor matching, and invariants.
6. **Camp geometry and gestures:** Coordinate transforms, snapping, rotation, real dimensions, landscape constraints, and future collision detection.
7. **Product scope tradeoff:** Why broad module coverage was built and why evidence now supports a narrower wedge.

## Is there enough depth today?

**Enough for solid mid-level mobile/full-stack conversations, but not yet enough for standout senior/platform/AI conversations.** The project has meaningful design choices, yet too many claims rely on implementation breadth and manual QA. Strong interview stories require measurements, tests, tradeoff records, and production incidents—not just feature descriptions.

## Add these interview-generating systems

- Versioned offline sync with operation IDs, idempotent replay, explicit conflict resolution, and chaos tests.
- Background job/queue for festival-data ingestion and refresh.
- RLS and API contract integration tests against an ephemeral Supabase instance.
- OpenTelemetry-style traces or equivalent structured spans from invite → contribution → offline packet.
- A model-evaluation pipeline for schedule/rule extraction, if targeting AI roles.
- Load test for one large festival’s synchronized traffic and postmortem on bottlenecks.
- Feature-flagged experiment that improves activation or contribution rate.

---

# Part 10 — Success probability

These are structured judgment estimates, not mathematically calibrated forecasts. Assumptions: one committed builder, the current codebase, 6–12 months of focused work, no undisclosed audience/partnerships, and a thesis narrowed to camping-crew operations.

| Outcome | Probability | Assumptions |
|---|---:|---|
| Successfully finish and deploy a strong version | **70%** | Codebase is already substantial; risk is focus, testing, native release, and production hardening rather than greenfield implementation |
| Becomes an impressive portfolio project | **80%** | Requires public demo, tests, observability, case study, and honest architecture story |
| Materially helps get interviews | **45%** | Targeted resume, demo link, credible ownership, and roles valuing React Native/full-stack/offline systems |
| Helps get a job | **20%** | Project contributes but cannot overcome market, experience, interview performance, or role-fit constraints alone |
| Gets meaningful real users | **45%** | “Meaningful” = 100+ activated groups or sustained use at 3+ festivals; requires direct community distribution and live pilots |
| Reaches $1,000 MRR | **12%** | Needs roughly 80–120 $10–$15 group purchases/month in season or several recurring partners |
| Reaches $10,000 MRR | **3%** | Requires a recognized category position, partner channel, or major expansion beyond current consumer wedge |
| Becomes a sustainable small company | **6%** | Requires repeatable acquisition, seasonal retention, and revenue sufficient to support ongoing data/support work |
| Becomes venture-scale | **0.7%** | Requires B2B2C platform expansion, authoritative data/distribution, and much larger monetization |
| Credible enough to pitch accelerators | **30%** | Credible technically today; commercially credible after activation, payment, and retention evidence |

These probabilities are intentionally separate. For example, a strong portfolio outcome can occur even if revenue and startup outcomes fail.

---

# Part 11 — Expected outcome

## Primary expected outcome: **Strong portfolio project**

Substantial effort is likely to produce a polished, technically credible application because much of the core implementation already exists. It is less likely to produce meaningful revenue because the market is crowded, usage is seasonal, group adoption is hard, and the broad differentiation has already been built by competitors. The most likely commercial result is some pilot users and little revenue; the primary durable value is proof of engineering and product execution.

**Best realistic outcome:** A respected niche product for serious camping-festival crews, with thousands of active groups, festival/community partnerships, $100K–$1M+ annual revenue, and an emerging B2B2C opportunity.

**Most likely outcome:** A strong portfolio application with 50–500 pilot groups, useful interview stories, modest organic attention, and little or no recurring revenue.

**Worst realistic outcome:** The final production/testing work stalls; direct competitors keep improving; no group reaches repeated activation; the project remains a large but unverified codebase.

---

# Part 12 — What would make this 10× stronger?

| Rank | Change | Startup impact | User impact | Resume impact | Difficulty | Time | Priority |
|---:|---|---:|---:|---:|---:|---|---|
| 1 | **Run 20 organizer interviews and 10 live group pilots before adding features; instrument the activation definition above** | 10/10 | 9/10 | 7/10 | Medium | 4–8 weeks across events | **P0** |
| 2 | **Reframe and redesign the first-run experience around “camp fits + who brings it + offline setup packet,” hiding nonessential modules until needed** | 9/10 | 10/10 | 7/10 | Medium | 3–6 weeks | **P0** |
| 3 | **Build a verified ingestion pipeline for lineup posters, festival rules, campsite dimensions, and travel confirmations—with schemas, provenance, confidence, human approval, and an evaluation corpus** | 8/10 | 9/10 | 10/10 for applied AI | High | 6–10 weeks | **P1** |
| 4 | **Productionize offline shared state: operation log/versioning, idempotent sync, explicit conflicts, background retries, and deterministic failure/chaos tests** | 8/10 | 9/10 | 10/10 | High | 6–12 weeks | **P1** |
| 5 | **Ship a public native beta with CI/CD, automated RLS/unit/E2E tests, crash reporting, analytics, privacy deletion, and two organizer/community distribution pilots** | 9/10 | 8/10 | 10/10 | High | 6–12 weeks | **P1** |

Why these five: each improves market evidence, product value, and hiring signal simultaneously. Collision detection, PNG export, weather, and aesthetic polish can support the wedge, but none substitutes for activation, data reliability, distribution, or production proof.

---

# Part 13 — Kill criteria

## Problem and segment

1. Interview **25 qualified crew organizers**. If fewer than **8** rank campsite/gear/group coordination among their top three festival-prep problems, abandon the current segment.
2. If fewer than **5 of 25** agree to pilot an existing usable build for a real upcoming festival, stop feature work and change the problem statement.
3. If the camp grid is used by fewer than **30% of activated camping groups**, or fewer than **15%** call it “would be very disappointed to lose,” it is not a viable wedge; simplify or remove it.

## Group activation

4. Across **10 live group pilots**, if fewer than **6 groups** get three invitees to join, the dedicated-app friction is too high; move to a web/no-install or official-partner distribution model.
5. If fewer than **40% of joined non-organizers contribute one item, vote, travel detail, or layout action**, the collaboration thesis is failing; redesign around organizer-only output or abandon group SaaS.
6. If fewer than **50% of pilot groups open the offline packet during the event window**, live/offline value is not strong enough to justify engineering complexity.

## Payment and economics

7. Offer a real **$9.99 group pass** to at least **30 qualified organizers**. If fewer than **3** pay or place a refundable deposit, do not build a consumer subscription business.
8. If paid/community acquisition costs more than **$15 per activated group** while realized gross profit remains below **$10 per group**, paid B2C acquisition is structurally unattractive; require a partner/organic channel.
9. If, after one full festival season, there are fewer than **100 activated groups**, fewer than **20 paid groups**, and no organizer/brand pilot, stop treating it as a startup and preserve it as a portfolio project.

## Retention and expansion

10. Among organizers with another festival within 12 months, if fewer than **30%** create or duplicate a second trip, annual retention is too weak for standalone SaaS.
11. If **10 festival/organizer conversations** yield zero willingness to distribute a crew template or run a pilot, reject the B2B2C expansion thesis.
12. If the AI ingestion pipeline cannot reach **>98% exactness on times/stages/dates after human-reviewed extraction** or cannot clearly flag uncertain rows, do not automate publication; keep it as a draft-assistance tool.

These criteria should be recorded before the next build cycle and evaluated without redefining “activated,” “paid,” or “pilot” after results arrive.

---

# Part 14 — Final scorecard

| Category | Score / 10 |
|---|---:|
| Problem severity | 6.0 |
| Market gap | 4.5 |
| Differentiation | 4.0 |
| Market size | 5.0 |
| Monetization | 4.0 |
| Defensibility | 3.0 |
| Distribution potential | 4.0 |
| Technical sophistication | 7.0 |
| Resume value | 6.5 |
| Interview value | 7.0 |
| Founder/project credibility | 6.5 |
| YC/startup pitch potential | 3.0 |
| Expansion potential | 5.5 |
| **Overall product opportunity** | **4.5** |

## BUILD / MODIFY / ABANDON verdict

# **BUILD, BUT CHANGE THE THESIS**

Continue because the codebase is real, the organizer pain is observable, and the camp-layout/offline-sync work can become an unusually strong engineering project. Do not continue on the belief that “all festival planning in one app” or future mesh networking is unique; current products invalidate both claims.

Make the thesis: **FestNest is the fastest way for a serious camping crew to prove its setup fits, assign every critical item, and carry one reliable offline setup plan into the field.** Treat lineup, budget, food, and travel as supporting inputs, not nine equal products.

The next milestone is not another feature. It is ten real groups using the current build at real festivals, instrumented against explicit activation, contribution, event-window usage, and payment criteria. If that evidence fails, keep the project as a portfolio asset and stop spending startup-scale effort.

The startup case should be reconsidered only after the product demonstrates organizer-led distribution and repeat use. The career case is already worth completing, provided production quality and evidence replace feature-count claims.

## Direct answers

1. **Is there a real gap?** Yes, a narrow workflow/UX gap around collaborative camp setup, gear ownership, and offline execution—not a broad “festival planner” gap.
2. **Is the gap big enough to matter?** It matters to a specific high-pain segment; it is not yet proven large enough for venture scale.
3. **Is this startup-worthy?** Worth validating as an indie/bootstrap startup; not yet justified as a venture startup.
4. **Is this YC-pitch-worthy today?** No. The broad thesis is duplicated and there is no verified traction in scope.
5. **Could it become YC-pitch-worthy?** Yes, with a sharp camp-operations wedge, 100+ activated groups, strong member contribution/reuse, payments, and organizer distribution.
6. **Is it impressive enough for my resume today?** Moderately impressive, especially for mobile/full-stack roles, but production proof is missing.
7. **Could it become a standout resume project?** Yes—particularly with tested offline sync, RLS/security verification, observability, live users, and an evaluated AI ingestion pipeline.
8. **Single strongest reason to continue:** The current camp-grid/offline/security architecture can become both a real niche solution and exceptional evidence that you can build difficult software.
9. **Single strongest reason to stop:** The broad product thesis is already built by active competitors, while low-frequency group adoption and distribution may prevent durable usage or revenue.
10. **What should I do next?** Freeze new feature work; instrument the current beta; recruit ten crew organizers at two or three upcoming camping festivals; run paid, observed pilots; and make the build/portfolio/startup decision using the kill criteria above.

---

# Research source appendix

## Direct and adjacent products

- [Rollyn — App Store](https://apps.apple.com/us/app/rollyn-festival-rave-app/id6759700821)
- [cht.so Festival Group Planner](https://www.cht.so/festival-group-planner)
- [FestiPlannr — App Store](https://apps.apple.com/us/app/festiplannr/id6762166101)
- [FestiPlannr — Product Hunt](https://www.producthunt.com/posts/festiplannr)
- [FestiView](https://www.festiview.com/)
- [Amicorum](https://amicorum.app/)
- [Setline](https://setlineapp.com/)
- [kndi](https://kndi.app/)
- [Appic — App Store](https://apps.apple.com/in/app/appic-festivals-more/id968362389)
- [Aloompa](https://go.aloompa.com/)
- [Wanderlog Pro](https://wanderlog.com/pro)
- [Wanderlog seed announcement](https://wanderlog.com/blog/2021/09/01/announcing-our-seed-fundraise/)
- [Wanderlog — YC](https://www.ycombinator.com/companies/wanderlog)
- [Campsite Layout Simulator — App Store](https://apps.apple.com/jp/app/%E5%A6%84%E6%83%B3%E3%82%AD%E3%83%A3%E3%83%B3%E3%83%97-%E3%82%AD%E3%83%A3%E3%83%B3%E3%83%97%E3%82%B5%E3%82%A4%E3%83%88%E3%83%AC%E3%82%A4%E3%82%A2%E3%82%A6%E3%83%88%E3%83%AC%E3%82%A4%E3%83%BC%E3%82%BF%E3%83%BC/id1557008556)
- [Flaresat](https://flaresat.com/)
- [CrowdLink](https://fionan313.github.io/CrowdLink/)
- [Truss](https://www.truss.one/)
- [Crowd Compass](https://www.crowdcompass.io/)
- [Loxation](https://www.loxation.com/)
- [Festapp open-source project](https://github.com/vkh-cr/festapp)
- [TREK open-source group-trip planner](https://github.com/liketrek/TREK)

## Customer pain and workarounds

- [Group festival camping inventory sheet — Reddit](https://www.reddit.com/r/LightningInABottle/comments/1s0fvx4/camping_with_a_group_try_out_my_group_camping/)
- [Camping layout app request — Lost Lands Reddit](https://www.reddit.com/r/LostLandsMusicFest/comments/1lh2pmx)
- [Sims campsite-layout workaround — Dancefestopia Reddit](https://www.reddit.com/r/Dancefestopia/comments/1tk24ob/car_camping_layout/)
- [Preferred car-camping layout — Electric Forest Reddit](https://www.reddit.com/r/ElectricForest/comments/1u8e655/preferred_car_camping_layout/)
- [Official festival app schedule complaints — Reddit](https://www.reddit.com/r/downloadfestival/comments/1kljnqs)
- [No-signal friend-location discussion — Reddit](https://www.reddit.com/r/festivals/comments/1s1z1t0/lost_my_group_at_every_festival_ive_ever_been_to/)
- [Wanderlog pricing complaint and per-trip request — Reddit](https://www.reddit.com/r/wanderlog/comments/1gahkpf/wanderlog_pro/)

## Market, startup, and failure evidence

- [Live Nation 2025 Form 10-K](https://investors.livenationentertainment.com/sec-filings/annual-reports/content/0001335258-26-000009/lyv-20251231.htm?TB_iframe=true&height=auto&preload=false&width=auto)
- [Travel planning as a difficult startup category — Hacker News](https://news.ycombinator.com/item?id=28481963)
- [2025 collaborative AI travel-app founder postmortem/request — Hacker News](https://news.ycombinator.com/item?id=44032047)
- [Earlier travel planning founder experiences — Hacker News](https://news.ycombinator.com/item?id=8419658)
- [Troupe appears defunct in 2026](https://tripti.ai/blog/rip-troupe-what-to-use-now)
- [YC essential startup advice](https://www.ycombinator.com/blog/ycs-essential-startup-advice/)
- [YC FAQ](https://www.ycombinator.com/faq/)
- [YC application/acceptance scale](https://www.ycombinator.com/investors)

