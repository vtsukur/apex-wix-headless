# Content & design audit — Headless Day deck compliance

Source: "Content & Design Tips" deck (Headless Day, 9.7.2026). Audited
2026-07-09 against the source (`src/pages`, `src/components`, `src/styles`)
and the live rendered copy at apex-drive.co (About body + FAQ answers live
in the Wix CMS, not the repo).

Verdict: the site passes the deck's biggest tests — un-generic, imagery
always shows the business, headline ↔ image aligned, clear story arc ending
in action. Divergences are concentrated in the typography-and-copy rules.

## Scorecard

| Deck rule | Fit |
|---|---|
| Not generic / unique | ✅ strong pass |
| Say what you are in 3 s | ✅ fixed 2026-07-09 — kicker restored (item 3) |
| Image ↔ headline one message | ✅ pass |
| Images show the business | ✅ pass (AI caveat accepted — item 6) |
| Kickers earn their place | ✅ fixed 2026-07-09 (item 7) |
| Captions describe what's seen | ✅ fixed 2026-07-09 (item 5) |
| Simple, understandable copy | ✅ fixed 2026-07-09 — About rewritten (item 4) |
| No period on titles/subtitles | ✅ fixed 2026-07-09 (item 2) |
| CTAs: short industry verbs | ✅ pass primary; noun secondaries accepted (item 7) |
| Avoid ALL CAPS | 🚫 accepted — deliberate motorsport identity (item 1) |

## Items

Status: ⬜ open · ✅ fixed · 🚫 reviewed & accepted as-is (deliberate divergence)

### 1. ALL CAPS titles — 🚫 accepted 2026-07-09

Deliberate motorsport identity (livery/timing-screen voice); caps are CSS-
only so the door stays open for a hybrid de-capping of the headline tier
later. Original finding:

Deck: "Avoid ALL CAPS." Every display heading renders uppercase via CSS —
`.display-hero` / `.display-xl` / `.display-lg` (`src/styles/global.css:417-433`),
plus buttons, nav, programme rows, and micro-labels (~19 selectors; also one
inline `uppercase` H2 in `src/pages/services/[slug].astro:341`). Source
strings are already sentence case — the transform is purely CSS, so any
rollback is per-selector. Note: caps on car designations (TH-12W) and tiny
letterspaced kickers are arguably fine — the deck's own "Good" kicker
example is uppercase. The bite is sentence-length headlines and buttons.

### 2. Periods at the end of titles/subtitles — ✅ shipped 2026-07-09

All 14 instances fixed: 10 repo edits (below, commit `39e8fd8`, released
same day and curl-verified live with `?rv=` busting) + 4 CMS taglines
updated via the Bookings REST API (`tagLine` AND `description` kept in
sync — the seed duplicated one into the other, and the detail page renders
`description` only when it differs, so both had to move together; verified
live on /services). Deliberately left: the footer tagline (borderline — body
copy, not a title) and the accent-dots (kept as the brand's period; with
the literal periods gone they are now the single consistent title-ending
device — item 1's caps decision may revisit).

Deck: titles and subtitles take no trailing period (body copy keeps them).
Full inventory (audited 2026-07-09; FAQ questions, kickers, and all other
headings checked clean):

Headings:
- `src/pages/index.astro:229` — H2 "Three cars. One discipline."
- `src/pages/index.astro:315` — H2 "Pick your drive."
- `src/pages/booking-confirmation.astro:26` — H1 "You're on the grid."

Subtitles (line directly under a heading):
- `src/pages/index.astro:213` — hero subtitle "…book and drive the racing
  line yourself."
- `src/pages/services/index.astro:113` — "One car. One circuit. One window
  of time. Pick the session — the wheel is yours."
- `src/pages/faq.astro:94-96` — "…read it once, then all that's left is
  the line."
- `src/pages/services/[slug].astro:342` — "Pick the window. Commit to the
  corner." (under H2 "Book your session")

Card sublines (subtitle role in the layout):
- Fleet role lines ×3 — `src/pages/index.astro:83`, `:98`, `:114` ("The
  circuit weapon. …", "The launch specialist. …", "The grand tourer. …")
- Service taglines ×4 (Wix CMS, render under card names and detail H1s):
  all end with a period ("…at race pace.", "…debrief included.", "…
  instructor alongside.", "…lunch included."). CMS edit, no deploy.

Borderline:
- `src/components/Footer.astro:9` — footer brand tagline "The point of
  maximum commitment. A supercar, a circuit, a window of time."

Design device (decide deliberately, one policy):
- Accent-dot — a designed red period appended to display titles, 4 usages:
  `index.astro:210` (hero H1), `index.astro:400` (final H2), `faq.astro:92`
  (H1), `about.astro:55` (H1). If kept as the brand's "period", literal
  periods on other titles become doubly inconsistent.

### 3. Hero 3-second test carried by subtitle alone — ✅ fixed 2026-07-09

Kicker "Supercar driving experiences" restored above the H1 (uncommented in
`src/pages/index.astro`) after weighing H1 alternatives ("Drive the thrill"
rejected as generic-abstract; "Commit to the corner" kept — concrete,
matches the film, explains the APEX name, echoed site-wide). The meaning
now sits in two of the deck's three slots (kicker + subtitle first clause).

Original finding:

H1 "Commit to the corner" is evocative, not descriptive. The meaning lands
only in the subtitle's first clause ("A supercar, a circuit, a time slot —
book and drive the racing line yourself") — allowed by the deck (H1 OR
kicker OR first subtitle clause), but the explicit kicker "Supercar driving
experiences" is commented out (`src/pages/index.astro:207-208`, "Hidden for
now, per request"). If the hero film is slow, one muted line does all the
explaining. Deck would restore the kicker.

### 4. About body opening is brochure-speak — ✅ shipped 2026-07-09

Lead + closing paragraphs rewritten in the About CMS item via the data API
(no deploy); middle two paragraphs (fleet, instructors — already concrete)
untouched. Verified live.

- Lead, was: "APEX represents the ultimate fusion of precision, courage,
  and mastery. We invite you to experience driving at the absolute limit…"
  Now: "APEX puts you behind the wheel of a supercar on a closed circuit —
  one car, one instructor, one timed session. You do the driving; the
  person beside you teaches you to hold the racing line at speed."
- Closer, was: "…APEX is where ambition meets capability. Safety at the
  limit. Never compromise." Now: "First time at speed or chasing your last
  few tenths — the shape of the day is the same. Briefing first, instructor
  alongside, cool-down lap to finish. Safety sets the limits; you drive up
  to them."

### 5. Caption kale — ✅ shipped 2026-07-09

About figure caption rewritten "Bay 3 · before first light" → "Helmet
bench · Bay 3" (`src/pages/about.astro:67`) — names what's in the frame,
keeps the plate voice. Deck: "Captions describe what is seen. Not more,
not less, no kale."

### 6. AI-generated imagery — 🚫 accepted 2026-07-09

Structural to the fictional-marque premise; mitigations (badge-free
original designs, consistent grade, motion-backed) stay. Original finding:

Deck warns against polished AI-generated perfection. The entire fleet +
garage imagery is AI-generated by design (`src/pages/index.astro:74-75`) —
the marque is fictional, nothing real to photograph. Mitigated: badge-free
original designs, consistent grade, motion-backed. Structural tension, not
fixable without changing the premise.

### 7. Terminology drift + noun-phrase secondary CTAs — ✅ shipped 2026-07-09

"Programme" retired site-wide (commit `ecc4ecd`, verified live): home
section/eyebrow/button/anchor now "The sessions" / `#sessions`, detail
eyebrow "The session", About stat "Sessions", llms.txt + comments swept.
Catalog kicker became "The line-up" — renaming it "The sessions" above the
H1 "Sessions" would have been the deck's literal redundant-kicker example.
The remaining vocabulary is a deliberate hierarchy, not drift: "supercar
driving experiences" = the category (hero kicker), "session" = the bookable
unit, "drive" = the act ("Book a drive"). Secondary CTAs stay noun-phrase
("The sessions", "The story") — accepted; it's the site's kicker voice.

Original finding: same offering named four ways — "programmes" (kickers),
"Sessions" (H1), "drives" (CTAs), "experiences" (meta), with kicker "The
programmes" directly above H1 "Sessions".

## Passed — no action

- Uniqueness: custom lap-film hero, fluid canvas, pinned fleet scroll,
  racing-curve progress. Nothing template-like.
- Headline ↔ image: "Commit to the corner" over a car at the apex; fleet
  cards pair name + role + that car's film.
- Business visible in every key image; decorative layers sit alongside,
  never instead.
- Action: "Book a drive" in nav/hero/cards/final scene; prices + durations
  on every card; primary CTAs are short industry verbs.
- Numbers-not-just-text: spec plates (977 PS · 2.5 s · 340 km/h), About
  figures strip.
- Contrast: hero scrim; FAQ hover deliberately avoids accent-red text on
  black.
