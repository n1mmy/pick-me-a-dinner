# Changelog

All notable changes to this project will be documented in this file.

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
