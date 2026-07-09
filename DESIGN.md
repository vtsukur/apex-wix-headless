---
version: alpha
name: "Apex"
colors:
  paper: "#0A0A0B"
  paper-warm: "#1A1B1E"
  ink: "#F2F0EB"
  ink-soft: "#C8C5BD"
  mute: "#8B8983"
  rule: "#2A2B2F"
  accent: "#E1121F"
  cream: "#E9E6DE"
  error: "#E5484D"
typography:
  display:
    fontFamily: "Oswald"
    fontWeight: 600
    letterSpacing: "0.02em"
  body:
    fontFamily: "Inter"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "0.125rem"
  md: "0.25rem"
containers:
  prose: "42rem"
  md: "28rem"
  3xl: "48rem"
  6xl: "72rem"
googleFontsHref: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400..600;1,14..32,400..600&family=Oswald:wght@300..700&display=swap"
---
# Apex — design tokens

The YAML frontmatter above is the canonical, machine-read design spec
(format: `references/shared/DESIGN_MD.md`). This body is documentation only
and is never parsed.

## Direction

Cinematic-dark motorsport: the held breath at the apex. A near-black canvas
(`paper #0A0A0B`) with a single signal-red accent (`accent #E1121F`) used
sparingly — like a brake light flaring in the dark — under bone-white type
(`ink #F2F0EB`). High contrast, generous negative space, film-still restraint.

## Palette notes

- `paper-warm #1A1B1E` — the graphite surface for cards and alternating
  sections; one visible step above the canvas, never a new hue.
- `ink-soft #C8C5BD` / `mute #8B8983` — the bone-white family stepped down
  through warm gray for secondary and muted text.
- `rule #2A2B2F` — dividers as faint seams in the dark, just above graphite.
- `cream #E9E6DE` — light fill derived from the bone family (inverted
  surfaces, light buttons).
- `error #E5484D` — the signal-red family lifted for legibility on the dark
  canvas (~5:1), kept distinct from the brand accent's flare.

## Type

- **Display: Oswald** — condensed, engineered; headline weight 600 with a
  touch of tracking; the 300–700 variable range covers light cinematic
  numerals through heavy titles.
- **Body: Inter** — precise, neutral instrument-panel text at 400–600.

## Shape and layout

Corners near-sharp (`2px` / `4px` equivalents) — precision, not softness.
Reading column ~42rem; wide compositions run to the 72rem page width with
negative space doing the framing.

## Deliberate content divergences — do not "fix"

Decisions from the 2026-07-09 content audit (full record: CONTENT.md,
removed at `7de2ffa` — see git history). These intentionally diverge from
generic content guidance and should survive future audits:

- **ALL CAPS display type** is the motorsport identity (livery/timing-screen
  voice), applied via CSS `text-transform` only — source strings stay
  sentence case so the decision is reversible per-selector.
- **AI-generated imagery** is structural: the marque is fictional, nothing
  real exists to photograph. Mitigations: badge-free original designs,
  one consistent grade, motion-backed, honest alt text.
- The **accent-dot** is the brand's title-ending period; literal trailing
  periods on titles/subtitles are banned instead.
- The vocabulary is a fixed hierarchy: "supercar driving experiences" =
  category, "session" = the bookable unit, "drive" = the act. The word
  "programme" is retired.
