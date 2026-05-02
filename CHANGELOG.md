# Changelog

All notable changes to this project will be documented in this file.

## [0.1.3.0] - 2026-05-01

### Fixed
- "Tonight" and date inputs now use Pacific time so the app no longer jumps a day ahead after 5pm — affected the home page's Tonight section, the Add and History date pickers, the calendar's current month and today highlight, and the Pick links on restaurants and meals
- "Last ordered" and "Last cooked" dates on the restaurants and meals pages now display the correct day instead of rolling back to the previous day in Pacific time

## [0.1.2.0] - 2026-05-01

### Added
- Mobile bottom tab bar (Tonight / History / Browse) for easy thumb-reach navigation on small screens
- Sub-navigation tabs on mobile to switch between Restaurants/Meals/Suggestions and History/Calendar without leaving the section
- Two prominent pick-myself buttons at the top of Tonight (one per dinner type) so you can decide without scrolling

### Changed
- Mobile-first redesign across Tonight, Suggestions, History, and list pages with larger tap targets and clearer hierarchy
- Suggestions page reworked to be faster to scan and pick from on mobile
- Add-dinner form polished for smoother mobile entry
- Delete buttons restyled with clearer affordance and confirmation states
- Layout, header, and section padding tightened for small viewports

### Fixed
- LoadingLink spinner now resets on same-page navigation instead of getting stuck
- Accessibility improvements: better focus states, ARIA labels on nav, and smoother transitions across the app

## [0.1.1.0] - 2026-04-13

### Added
- Design system: "Midnight Diner Ledger" aesthetic with warm dark backgrounds, Fraunces display font, Instrument Sans body font, and Geist Mono for tabular data
- DESIGN.md documenting the full design system (colors, typography, spacing, motion)
- Surface-raised color token for hover states
- Tabbed navigation on suggestions page (Restaurants / Meals tabs)

### Changed
- Background color deepened from slate (#494f5c) to dark charcoal (#2a2f38)
- Text color warmed from cool white (#f0f4f7) to warm off-white (#f0eae4)
- Light mode background changed from pure white to warm cream (#f7f3ed)
- Suggestions page now shows all items sorted by recency score instead of a limited subset
- Dates and count badges now use monospace font (Geist Mono) for ledger-like feel
- Navbar cleaned up: replaced hardcoded hex colors with semantic CSS variable classes

### Removed
- Reject/fetch-more workflow on suggestions page (replaced by full sorted list with tabs)
