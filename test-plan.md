# Visual Test Plan

## Setup
1. Start PostgreSQL via `docker-compose up -d`
2. Install dependencies: `yarn install --ignore-engines`
3. Start dev server: `yarn dev` (via preview_start)

## Pages Tested

### `/` — Home
- "TONIGHT" section displays restaurant and homecooked suggestions with "No thanks" and "Choose" actions
- Last 7 days listed below with "+ Add" links for days without a dinner
- "Load more" button at the bottom
- Nav bar present: Pick Me a Dinner, History, Suggestions, Restaurants, Meals

### `/add` — Add Dinner
- Date picker defaults to today
- Restaurant / Homecooked toggle switches form context
- Restaurant dropdown populated from database
- Notes textarea with placeholder
- "Save dinner" button
- Inline "+ Add new restaurant" collapsible section at bottom

### `/history` — Dinner History
- Date picker and "+ Add" button in header
- Entries show name, date, type (Restaurant/Homecooked), notes, and tags
- Edit and Delete actions on each entry
- Paginated (30 per page)

### `/restaurants` — Restaurants
- Add form: name (required), phone number, order URL, notes, tags
- Restaurant list with name, tags, order count, edit link, and order URL link
- "Show hidden restaurants" toggle at bottom

### `/meals` — Homecooked Meals
- Add form: name (required), notes, tags
- Meal list with name, cook count, and edit link

### `/suggestions` — Suggestions
- Restaurants section with scored suggestions and "Choose" links
- Homecooked section with scored suggestions and "Choose" links

## Results
- All 6 pages render correctly
- Zero browser console errors
- Zero server errors
- Layout and navigation consistent across all pages
