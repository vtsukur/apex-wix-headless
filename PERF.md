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

### 1. Defer the hero video out of the measurement window — 🔄 in progress

`preload="none"`, no `src` at parse time; the rendition is attached after
`window.load` + idle (skipped entirely under `prefers-reduced-motion`).
Poster (35 KB webp) preloaded in `<head>` with `fetchpriority=high` → LCP
becomes a deterministic poster paint instead of a race. Coupled change:
the boot curtain now gates on **poster decode** (3 s cap) instead of hero
video `readyState ≥ 3` (8 s cap) — mandatory, or the curtain would hang
waiting for a video that no longer loads at startup. The 3.2 s min-hold is
unchanged (item 2 decides that separately).

**Result:** _pending measurement._

### 2. Trim the boot-curtain minimum hold — ⏸ pending (taste decision)

3,200 ms min-hold → ~1,800–2,000 ms keeps the cinematic beat but returns
~1.4 s of Speed Index. SI is the weakest remaining metric. Curtain owner
call — explicitly NOT done until approved.

### 3. Teaser-card videos: `preload="none"` + IntersectionObserver — ⬜ todo

The three fleet films (~1.76 MB) still download at startup, several
viewports below the fold. Attach `src` when the pinned fleet section
approaches. Expected: −1.76 MB startup weight, removes the residual
network contention, helps mobile main-thread and desktop TBT.

### 4. Cache warmer — ⬜ todo

Edge cache TTL is 30 min; a bot testing at a quiet moment lands on a MISS
(~1.5–2 s TTFB → LCP back to ~4 s → score < 90). A GitHub Actions cron
hitting `/`, `/about`, `/faq` every ~15 min makes the 90 ms document a
guarantee instead of a coincidence.

### 5. CTA band background image — ⬜ todo

`global.css` ships a fixed `w_1920` 166 KB jpg to every viewport as a CSS
background. Swap to media-queried variants (or `image-set()`) — ~120 KB
saved on phones.

## Measurement protocol

Local Lighthouse (same engine as PSI): 3 runs, mobile default preset,
against https://www.apex-drive.co/. The keyless PSI API is quota-blocked;
spot-check on https://pagespeed.web.dev before submitting to the bot.
Remember the edge cache: `curl -s "https://www.apex-drive.co/?rv=$RANDOM"`
bypasses it (release verification), plain `/` measures the cached path the
bot sees.
