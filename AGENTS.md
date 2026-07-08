# Apex

A Wix headless site built with the `wix-headless` skill. Fictional supercar driving-experience outfit — book a session behind the wheel of a specific supercar on a specific circuit at a specific time.

## Live site
- **Site:** https://www.apex-drive.co (canonical; threshold-1e91281d-vladimirtsukur.wix-site-host.com 301s here)
- **Dashboard:** https://manage.wix.com/dashboard/13a36de2-a167-4d86-ad48-725124891763

## Frontend
astro (Wix-hosted). Run: `wix dev`. Build + publish: `wix release`.

## Features
- Bookings — bookable driving experiences with instructor selection, a day-grouped availability calendar, and Wix's hosted checkout for paid sessions
- CMS — content collections (About, FAQ)

## Pages
- `/` — home (hero, sessions teaser)
- `/about` — About (CMS)
- `/faq` — FAQ (CMS)
- `/services` — experiences catalog (Wix Bookings)
- `/services/[slug]` — experience detail + availability + booking
- `/booking-confirmation` — post-booking confirmation

## Seeded content
4 bookable services · 2 staff instructors · About + FAQ collections (1 + 6 items).

## Extending
Built with the `wix-headless` skill; re-run it to add features or restyle.

## CLI Commands
All CLI instructions can be found at:
node_modules/@wix/cli/agents/instructions.md

## Skills
This project comes with a set of skills that can be used when the user asks for help with specific tasks.
If you're using the instructions provided by a skill and fail, or if you do not find a relevant skill for the task,
you can try updating the skills by running the following command:

`wix skills update`

This will update the skills to the latest version.
