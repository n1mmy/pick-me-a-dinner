# Design System — Pick Me a Dinner

## Product Context
- **What this is:** A family dinner tracker that manages restaurants and homecooked meals, tracks what you ate, and picks suggestions weighted toward things you haven't had recently
- **Who it's for:** A single household deciding what to eat tonight
- **Space/industry:** Personal utility, meal decision-making (not meal planning, not recipes)
- **Project type:** Web app, mobile-first, used primarily in the evening

## Aesthetic Direction
- **Direction:** Midnight Diner Ledger — warm dark utility with analog personality. Not software-y, not wellness-y. Feels like a neighborhood restaurant's menu board at dusk.
- **Decoration level:** Intentional — subtle grain texture on surfaces, nothing decorative
- **Mood:** Confident and cozy. It's 6:42 PM, low light, hungry, choosing now. The dark surface is the product's native material.
- **Anti-patterns:** No food photography, no wellness/green-orange palette, no recipe-card styling, no purple gradients, no decorative blobs, no 3-column icon grids

## Typography
- **Display/Hero:** Fraunces (weight 600-700) — warm optical serif with dinner-card, journal-like personality. Used for page headings and the suggestion display.
- **Body:** Instrument Sans (weights 400/500/600) — clean, modern sans-serif without being generic. Used for all body text, labels, navigation.
- **UI/Labels:** Instrument Sans (weight 500)
- **Data/Tables:** Geist Mono — monospace with tabular-nums for dates, history ledger rows, and metadata
- **Code:** Geist Mono
- **Loading:** Google Fonts via next/font/google
- **Scale:**
  - 3xl: 2.25rem (36px) — page hero headings
  - 2xl: 1.875rem (30px) — section headings
  - xl: 1.5rem (24px) — subheadings
  - lg: 1.125rem (18px) — large body, suggestion name
  - base: 1rem (16px) — body text
  - sm: 0.875rem (14px) — secondary text, nav links
  - xs: 0.75rem (12px) — metadata, timestamps

## Color
- **Approach:** Restrained — pink is the decisive action color, teal signals freshness/recency, everything else stays quiet
- **Dark mode (default):**
  - Background: `#2a2f38` — deep slate, makes accents glow
  - Surface: `#353b45` — raised cards, nav bar
  - Surface raised: `#3f4650` — hover states, active elements
  - Primary text: `#f0eae4` — warm off-white
  - Muted text: `#a8b0bb` — secondary text, timestamps
  - Pink (accent): `#fe5185` — decisive actions (Pick for me, submit, primary CTAs)
  - Teal (secondary): `#01a890` — freshness signals, recency indicators, links
  - Border: `rgba(168, 176, 187, 0.2)` — subtle separators
- **Light mode:**
  - Background: `#f7f3ed` — warm cream
  - Surface: `#e8e1d5` — warm stone
  - Primary text: `#1c1a18` — near-black, warm
  - Muted text: `#706b63` — warm gray
  - Pink: `#c42a57` — deeper for contrast on light backgrounds
  - Teal: `#016858` — deeper for contrast on light backgrounds
  - Border: `rgba(28, 28, 28, 0.12)`
- **Semantic:** success `#01a890` (reuses teal), warning `#e5a100`, error `#d94040`, info `#5b8def`

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable — not cramped, not wasteful
- **Scale:** 2xs(2px) xs(4px) sm(8px) md(16px) lg(24px) xl(32px) 2xl(48px) 3xl(64px)

## Layout
- **Approach:** Grid-disciplined with poster-like composition on the home page
- **Grid:** Single column on mobile, suggestion + history side-by-side at md+ breakpoints
- **Max content width:** 42rem (672px, matches current max-w-2xl)
- **Border radius:** sm: 4px, md: 8px, lg: 12px (cards, suggestion panel)
- **Composition:** Home page suggestion is the visual hero. History reads as a compact ledger with monospace dates, not equal-weight cards.

## Motion
- **Approach:** Minimal-functional — transitions that aid comprehension only
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms)
- **Usage:** Color transitions on hover/focus, subtle fade for page content. No entrance animations, no scroll-driven effects.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-13 | Initial design system created | Created by /design-consultation. Researched Mealime, Paprika, Eat This Much, Kitchen Stories. Three-voice proposal (Claude + Codex + Claude subagent). User approved Variant C (two-column composition with warm Fraunces heading). |
| 2026-04-13 | Keep neon pink #fe5185 over dusty rose | Original neon pink pops harder on the deep dark background, gives the app its signature punch |
| 2026-04-13 | Fraunces + Instrument Sans over Space Grotesk + Geist | Warm, analog personality over tech-startup vibe. Instantly recognizable, feels personal. |
| 2026-04-13 | Deeper background #2a2f38 over #494f5c | Makes the whole thing feel like evening, not just "another dark theme." Pink/teal accents glow against it. |
