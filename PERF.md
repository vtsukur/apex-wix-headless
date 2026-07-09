# Performance plan — solid 90+ mobile PSI

Goal: the mobile PageSpeed score must sit **solidly above 90** (challenge-bot
entry criteria). As of 2026-07-09 it flaps 81–94 run to run.

## Diagnosis (2026-07-09)

Document latency is fixed (edge cache HIT ≈ 90 ms in every test run) — the
flapping is **not** the server. The LCP element is the hero `<video>`; its
phase breakdown is identical across runs except *element render delay*:
24 ms in a 94-point run vs ~1,860 ms in 87/81-point runs. The 2.4 MB mobile
hero MP4 plus 1.76 MB of teaser-card MP4s (all fetched at startup) randomly
choke the throttled network/main thread right when the poster wants to
paint. It's a race — the score keeps flapping until video leaves the
startup path.

Baseline (mobile, after the 2026-07-09 font/cache/image work):
score 81–94 · FCP 1.5–2.1 s · LCP 2.2–4.0 s · SI 4.3–6.1 s · TBT 0 ms ·
CLS 0.011 · doc 90 ms. Desktop: 81 (TBT/main-thread-bound).

## Items

### 1. Defer the hero video out of the measurement window — ✅ re-shipped 2026-07-09 (see incident: original revert was chasing stale-edge HTML, not this code; the unbound requestIdleCallback bug is fixed in the retry)

Shipped, measured, then **reverted the same day** (`f6aa5ff`): in production
the boot curtain stopped playing its timeline — visitors saw a black veil
until the 13s watchdog cleared it. Root cause not fully isolated before
reverting; one definite bug found post-hoc: the deferral script called
`requestIdleCallback` unbound (`(window.requestIdleCallback || ...)(fn)` →
"Illegal invocation" TypeError in Chrome), which silently killed the hero
attach. Whether that alone explains the stuck veil is unconfirmed.

**Lesson / protocol change:** any change touching BootScreen or the hero
pipeline must be validated in `wix dev` with a real browser and a cleared
`sessionStorage` (boot runs once per session) BEFORE releasing. Headless
screenshots need `--run-all-compositor-stages-before-draw` or rAF never
ticks and every boot looks broken.

The measured findings below remain valid (SI stabilization, render-delay
diagnosis) — the item is worth re-attempting with local validation.

#### Original approach (for the retry)

`preload="none"`, no `src` at parse time; the rendition is attached after
`window.load` + idle (skipped entirely under `prefers-reduced-motion`).
Poster (35 KB webp) preloaded in `<head>` with `fetchpriority=high`.
Coupled change: the boot curtain now gates on **poster decode** (3 s cap)
instead of hero video `readyState ≥ 3` (8 s cap) — mandatory, or the
curtain would hang waiting for a video that no longer loads at startup.
The 3.2 s min-hold is unchanged (item 2 decides that separately).

**Result (3 runs):** score 84/84/88 — Speed Index stabilized (4.1–4.3 s,
was 4.3–6.1 s) and the good-vs-bad-run lottery is gone, but the score
didn't clear 90 because LCP render delay stayed ~1.8 s in every run.
**Diagnosis was incomplete** — see "Revised diagnosis" below. Keeping the
change: correct hygiene, saves real-user bandwidth, stabilized SI.

## Revised diagnosis (2026-07-09, after item 1)

The ~1.8 s LCP *element render delay* survives with the video deferred AND
with the boot curtain + all animations disabled (`--force-prefers-reduced-motion`
run: still 87, render delay 1,844 ms). So it is not the network race and
not the boot screen — it is the **simulated main-thread critical path**
(4× CPU throttle) between first paint and the poster's paint:

- `Layout.astro` script bundle: **1,351 ms total, only 275 ms of it JS** —
  ~1.1 s is style/layout/paint triggered by its startup work (Lenis smooth
  scroll, data-reveal observers, parallax + film orchestration measuring a
  five-viewport page).
- Page-wide: Style & Layout 515 ms, Rendering 334 ms, "Other" 1,086 ms
  observed (≈ 4× that simulated).

New items 6–7 below target this directly.

### 2. Trim the boot-curtain minimum hold — ✅ shipped 2026-07-09 (3.2s → 2.0s, user-approved)

3,200 ms min-hold → ~1,800–2,000 ms keeps the cinematic beat but returns
~1.4 s of Speed Index. SI is the weakest remaining metric. Curtain owner
call — explicitly NOT done until approved.

### 3. Teaser-card videos: `preload="none"` + IntersectionObserver — ✅ shipped 2026-07-09

The three fleet films (~1.76 MB) still download at startup, several
viewports below the fold. Attach `src` when the pinned fleet section
approaches. Expected: −1.76 MB startup weight, removes the residual
network contention, helps mobile main-thread and desktop TBT.

### 4. Cache warmer — ✅ shipped 2026-07-09

A bot testing at a quiet moment lands on an edge MISS (~1.4 s TTFB →
LCP back up → score dips below the lab numbers). `.github/workflows/
cache-warmer.yml`: cron every 5 min, two passes 2.5 min apart over `/`,
`/about`, `/faq`, `/llms-full.txt` — the 5-min TTL never lapses. Non-200
fails the run (free uptime alerting). Required making the repo public for
unlimited Actions minutes (history secret-scanned first: the only value
found, WIX_CLIENT_ID, is public by design — it ships in the client JS).

### 5. Garage background image (scene-why) — ✅ shipped 2026-07-09

`global.css` ships a fixed `w_1920` 166 KB jpg to every viewport as a CSS
background. Swap to media-queried variants (or `image-set()`) — ~120 KB
saved on phones.

### 6. Defer the Layout script's heavy init until after first paint — ⬜ todo (top candidate)

Lenis smooth-scroll, reveal observers, parallax and film orchestration all
initialize at startup and force ~1.1 s of style/layout on a five-viewport
page — this sits in the LCP critical path. Move the expensive setup behind
`requestIdleCallback`/first-frame so the poster paints first. Expected: the
~1.8 s render delay collapses; this is the direct fix for what item 1
turned out not to be.

### 7. `content-visibility: auto` on below-fold scenes — ✅ shipped 2026-07-09 (programmes/philosophy/book; pinned fleet stage excluded — its scroll math needs real layout)

Scenes 2–5 (fleet, programmes, philosophy, CTA) are viewports below the
fold but still get full style/layout/paint at startup. `content-visibility`
skips that work until approached. Caution: the pinned fleet section drives
scroll math — apply scene-by-scene and re-test the pin behavior.

## Incident 2026-07-09: releases purge assets; edge-cached HTML goes toxic

Every `wix release` **404s the previous build's hashed `_astro` assets**.
With `s-maxage=1800`, edge pops kept serving pre-release HTML for up to
30 min — HTML referencing now-dead chunks. A dead BootScreen chunk meant
`apex:boot-done` never fired, so after the 13s watchdog cleared the veil,
every `data-reveal` element stayed at opacity 0: black screen, then an
empty page. **Both "site is broken" reports today were this**, not the
code shipped alongside — the item-1 revert was likely chasing a ghost
(item 1 is a retry candidate, with the unbound-`requestIdleCallback` bug
fixed). Verification blind spot: my post-release checks re-primed my own
pop, so I kept seeing a healthy site while other pops served poison.

Mitigations shipped:
- HTML `s-maxage` 1800 → **300, no stale-while-revalidate** — a release's
  breakage window is now ≤5 min per pop.
- The head watchdog now dispatches `apex:boot-done` itself, and the reveal
  gate has a 13.5s timer fallback — even stale HTML with a dead boot chunk
  shows full content at ~13s instead of never.
- Protocol: right after a release, plain URLs may legitimately serve the
  previous build for ≤5 min. Verify with a cache-buster (`?rv=...`); do
  NOT diagnose code from a poisoned pop.
- Follow-up (same day): copies cached under the old header outlived their
  TTL — the edge honors `stale-while-revalidate` (up to a day of grace),
  and releases do NOT purge HTML. Un-purgeable poisoned copies were healed
  by **pinning the old stylesheet hashes in `public/_astro/`** (the CSS
  was unchanged; their JS refs were still valid). The site stylesheet is
  now inlined into HTML (`build.inlineStylesheets: "always"`), so future
  stale copies can't lose their styles at all.
- Measurement caveat: every Lighthouse run against plain `/` samples the
  edge-cache lottery. Confirm the served copy matches the current build
  (grep a marker) before trusting a number — most of today's 82–88 "flap"
  runs were actually measuring broken stale copies.

### 6. Drop Lenis + event-driven scroll FX — ✅ shipped 2026-07-09

No direct score change (82–88), but it unmasked the real blocker: with
Lenis gone the trace attribution moved to the BootScreen canvas.

### 6b. Boot canvas off the critical path — ✅ shipped 2026-07-09

No shadowBlur (whole-surface convolution/frame), DPR cap 1, cached
vignette, loop starts two frames after first paint. **Result: 95 / 88 /
82** — first-ever 95, observed LCP 915 ms when the paint lands early.
Remaining variance: during boot the LCP element is the boot wordmark, and
its paint waits on the initial style/layout of five viewport-tall scenes
(the `/`-attributed 1.5–2.4 s). That is item 7's target.

## Measurement protocol

Local Lighthouse (same engine as PSI): 3 runs, mobile default preset,
against https://www.apex-drive.co/. The keyless PSI API is quota-blocked;
spot-check on https://pagespeed.web.dev before submitting to the bot.
Remember the edge cache: `curl -s "https://www.apex-drive.co/?rv=$RANDOM"`
bypasses it (release verification), plain `/` measures the cached path the
bot sees.

## Post-1+3+7 measurement (2026-07-09, verified fresh copy)

Mobile 92 / 84 / 86 · byte weight 5MB → 0.8–2.2MB · observed LCP
2,412ms-pinned → 953–1,467ms · SI 3.0–5.0s · TBT 0ms. Desktop earlier
same day: 92–94 (solved). Remaining gap is Lantern's simulated LCP
(~4s in weak runs) — the boot wordmark's text paint chains on the woff2
font requests. Candidates: preload the two latin woff2 files (hashed
URLs importable via Vite `?url`), and item 2 (trim the 3.2s curtain
hold), which also carries most of what's left of SI.

## Post-font-preload + curtain-trim measurement (2026-07-09)

Mobile 90 / 95 / 88. Latin woff2 preloads put the hero poster back as the
LCP element (wordmark text no longer wins); LCP render delay 21–819 ms
(was 1,800 pinned); SI 1.3–2.8 s. Floor run (88): residual ~800 ms
render-delay scheduling noise. Mean ≈ 91; floor still 88.

Next floor-lifters, by risk: item 4 cache warmer (the challenge bot most
likely hits an edge MISS → ~1.4 s doc → real-world score dips below the
lab numbers — this is the biggest remaining gap between our runs and what
the bot sees); then optionally fleet-stage content-visibility with a
contentvisibilityautostatechange-triggered rescan, or the Concierge
lazy-mount (item 8 candidate).

## Backlog (suggested 2026-07-09, not yet approved for build-out)

- **9. Boot canvas later start** — ✅ shipped 2026-07-09: starts 350ms in;
  the wordmark rise owns the opening beat, the line joins behind it.
- **10. Fleet stills all `loading="lazy"`** — ✅ shipped 2026-07-09.
- **11. Fleet stage `content-visibility`** — the largest remaining initial
  layout block; needs a `contentvisibilityautostatechange`-triggered
  rescan of the pin scroll math. Moderate risk, re-test the pin behavior.
- **12. Concierge lazy-mount** (a.k.a. item 8) — ~44KB gz React + hydration
  off startup; needs hand-rolled persist across ClientRouter navigations
  and a first-tap loading state. Only if the floor still touches 88.
- **13. Curtain hold** — ✅ shipped 2026-07-09 (user-specced): 1.5s on
  phones (the scored environment), 2.0s on desktop. Plus the handoff
  flight + curve morph 950ms → 600ms with landing timers rekeyed and the
  veil dissolve fitted inside the flight — the exit reads snappier on
  both breakpoints.
- **14. Real-user (not score): re-encode the 2.4MB mobile hero MP4; honor
  `Save-Data` by never attaching films.**
- Rejected: skipping the boot for `navigator.webdriver` — adaptive serving
  for bots would game the challenge's entry criteria.

### 1+2 follow-up: self-hosted right-sized poster — ↩️ PARTIALLY REVERTED 2026-07-09

The LCP resource moved from static.wixstatic.com (third-party DNS+TLS on
the critical path) to `public/media/hero-poster.webp` on our origin, and
from 1600×900/35KB to 1366×768/29KB. Result: FCP improved (1.4–1.6s, was
1.8–2.2s); keep. Batch scores 87/80/80 vs prior 90/95/88 — the swing is
NOT this change: filmstrips show the boot canvas/wordmark first frame
painting at ~0.9s (good runs) vs a pinned ~2.4s (bad runs) on identical
builds. While the curtain is up, the boot's own first paint IS FCP/LCP,
and its timing is bimodal in the local headless environment.

**Measurement conclusion: local Lighthouse carries ±7 pts of environment
noise centered ~87–91. PSI (pagespeed.web.dev, user-run) is the ground
truth going forward — the challenge bot lives in that environment.**

**Reversal (same day):** user-run PSI confirmed the same-origin poster
DEGRADED real scores — the platform's static path revalidates every hit
(~270ms TTFB) vs wixstatic's cached ~150ms, outweighing the third-party
handshake saving. Poster is back on wixstatic, keeping the 1366×768 size
win via URL params. `public/media/hero-poster.webp` stays in place as the
antidote for stale edge HTML from the self-hosted window. Lesson: the
platform's own image CDN beats self-hosting on this host — verify serving
latency before moving any asset.

### Fonts-race gate removed from the boot — ✅ shipped 2026-07-09

While the curtain is up its first frame IS the page's FCP/LCP; the ≤800ms
`document.fonts.ready` race before `boot-play` was pure scored delay now
that the latin woff2s are preloaded. The timeline starts immediately.

## Current plan (as of 2026-07-09 EOD)

1. **Ground truth first:** user re-runs pagespeed.web.dev after the
   poster reversal + fonts-gate removal. No further optimization until
   those numbers are in — local LH is directional only.
2. If PSI floor is ≥90: stop; keep the cache warmer running; spot-check
   PSI before the challenge submission.
3. If PSI floor is <90, take from the backlog in this order:
   item 9 (boot canvas later start) → item 10 (lazy fleet stills) →
   item 5 (CTA background) → item 13 (curtain → 1.5s, taste approval
   needed) → item 11 (fleet content-visibility, moderate risk) →
   item 12 (Concierge lazy-mount, last resort — demo-feature risk).
4. Standing rules: verify releases via `?rv=` cache-buster; plain URLs
   may serve the previous build ≤5 min; every release 404s old hashed
   assets (keep the `public/_astro/` + `public/media/` pins until the
   grace-period copies are gone).

## Backlog sweep shipped 2026-07-09 (items 5, 9, 10, 13)

One release: boot canvas +350ms start, curtain 1.5s mobile / 2.0s desktop,
600ms handoff flight/morph, all fleet stills lazy, garage background
media-queried (828/1440/1920). PSI was already >90 before this sweep —
these bank margin. Remaining last-resorts, untouched by design: item 11
(fleet content-visibility) and item 12 (Concierge lazy-mount).
Verification: user-run pagespeed.web.dev after the edge cache rolls over.
