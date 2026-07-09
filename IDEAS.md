# APEX — Competition Idea Board

Creative directions for making this the standout entry in the internal Wix
headless competition. The audience is Wix judges, so the strategy is threefold:
make the **booking flow itself** the showpiece, wire in **more Wix verticals
headlessly** than anyone else, and **dogfood the platform's agentic/MCP story**
so hard it becomes the demo everyone remembers.

Groundwork already shipped: full SEO head layer (canonical, OG/Twitter cards,
Organization/WebSite JSON-LD), FAQPage + Service/Offer/ReserveAction/Breadcrumb
structured data, curated `/llms.txt` route, and the platform's live MCP endpoint
(`/_api/mcp`) discovered and verified — agents can already search the site and
book sessions through it.

---

## The headline act: agentic booking, dogfooded

### 1. "The Concierge" — an on-site agent that books through the site's own MCP
✅ **Shipped** (`002adbd`). A chat island (Claude API route + the site's own
MCP tools) mounted site-wide: a visitor types *"something fast, Saturday
morning, under €600"* and the concierge finds the TH-12W session, checks real
slots, and walks them to checkout. A Wix headless site consuming Wix's own
Site MCP, working end-to-end.

### 2. "Book it with your own AI" page
✅ **Shipped.** `/agents` — the endpoint plated with copy buttons, wire-up
for Claude Code / Claude.ai / any MCP client, a paste-ready booking prompt,
the tool roster, and the machine-readable layer (llms.txt, JSON-LD) linked.
Registered in the sitemap, llms.txt, and the footer.

---

## Make the functional core the design flex

### 3. The timing-tower calendar
Everyone's availability picker looks like a calendar. Restyle ours as an F1
timing tower — days as race sessions, slots as laps, the chosen instructor as
your race engineer. Moving the site's existing craft (boot curtain, apex cuts)
into the *transactional UI* is what "best headless site" means — beautiful AND
wired to real Bookings data.

### 4. The Grid Pass confirmation
Post-booking, generate a designed "grid pass" — car designation, circuit,
session time, a QR code — with an `.ics` download and, ambitiously, Apple/Google
Wallet passes. Judges book a test session and get a souvenir; that's the
screenshot that circulates in Slack.

### 5. Conditions at the circuit
A live weather strip on service pages ("Dry · air 22° · track 31°") from a
weather API, SSR'd. Cheap, and it makes the fiction feel operational.

---

## Platform breadth (what Wix judges score consciously)

### 6. "The Paddock" — members area
Login, my bookings, reschedule/cancel, past sessions. Headless Wix Members +
Bookings management is the single biggest capability gap left, and it demos
auth.

### 7. "Gift a drive"
Wix gift cards, headless — driving experiences are the canonical gift purchase,
so it reads as product thinking, not checkbox-ticking.

### 8. The Debrief — reviews done the racing way
Post-session Wix Form → moderated CMS collection → quotes on service pages with
`AggregateRating` JSON-LD (stars in search, food for the LLM layer already
shipped). Forms + CMS + SEO in one feature.

### 9. Apex License — loyalty tiers
Points per session, Novice → Apex tiers via Wix Loyalty. Pairs naturally with
the members area.

---

## Craft garnish (cheap, memorable, very shareable)

### 10. The 404 run-off area
✅ **Shipped** (then refined by review). "You've gone off track" — a framed
telemetry plate: ghost 404 top-left, the racing line drawing the corner, a
dashed trail past skid marks into an organic gravel trap, a pulsing *you are
here*. Plain-bar header on this page (the scene owns the red curve), real
404 status, noindex, reduced-motion safe, story counter-scaled for phones.

### 11. RPM scroll gauge
✅ **Shipped.** The top hairline doubles as a rev counter: scroll velocity
revs it (redline ≈ 3500px/s), lift-off decays it like a closed throttle,
holding redline bangs a gear shift. Yields to the loading-bar states during
navigation; dark at idle and under reduced motion.

### 12. An easter egg
✅ **Shipped.** Type A-P-E-X anywhere (outside a text field): the boot
corner redraws across the viewport in champagne gold, a ghost TH-12 laps it,
the apex ring flares as it crosses, and the readout stamps
GHOST LAP · 1:07.404. One lap, ~3s, gone.

---

## Speak to the judges directly

### 13. `/colophon` — "How this is built"
Architecture, every Wix API used headlessly (Bookings, Data, Forms, Redirects,
MCP), the SEO/LLM layer, repo link. Judges shouldn't have to reverse-engineer
why the site deserves to win — hand them the scorecard.

### 14. Technical flawlessness as a claim
Lighthouse near-100s, a CI smoke test, zero-JS-required content (already true).
Put the numbers on the colophon. Partially earned already — the PERF.md
backlog sweep shipped (poster, fonts gate, lazy stills) — but no numbers are
published and the only CI workflow is the cache warmer.

---

## Shortlist — playing to win

~~The Concierge (#1)~~ — ✅ shipped; the headline is live.

1. **Colophon (#13)** — the last cheap-leverage item; the story it tells
   keeps getting better (#1, #2, #10 ✅ done).
2. **Timing-tower calendar + Grid Pass (#3, #4)** — the core flow becomes the
   portfolio piece.
3. **The Paddock (#6)** — biggest breadth unlock.
4. **Debrief reviews (#8)** if time allows — compounds with the SEO/LLM work
   already shipped.

Next build recommendation: **the polish trio (#2, #10, #13)** — cheapest
leverage now that the Concierge proves the story they document.
