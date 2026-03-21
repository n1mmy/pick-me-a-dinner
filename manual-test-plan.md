# Manual Test Plan — Pick Me A Dinner

## Prompt for automated execution

```
Run the manual test plan in manual-test-plan.md. Use preview_start to start the dev server, then work through each section systematically using the preview tools (preview_snapshot, preview_click, preview_fill, preview_inspect, preview_screenshot, preview_resize).

Create any necessary test data via the UI as you go (e.g. add restaurants and meals before testing hide/delete, add dinners before testing the home and history pages).

Implementation notes from prior runs:
- preview_snapshot occasionally fails with "t.slice is not a function" — fall back to preview_eval with DOM queries (document.body.innerText, document.querySelector, etc.)
- Server actions (form submissions) require form.requestSubmit() not button.click(). Use: document.querySelector('form').requestSubmit() or input.form.requestSubmit()
- To test empty calendar months, use a far-future date (e.g. 2027-06) — the DB likely has extensive history going back years
- For whitespace/text content bugs, use preview_eval with element.innerHTML (not textContent) to see exact rendered markup
- At the end, run preview_console_logs to check for any browser errors accumulated during the session

Skip steps that require real database state you can't set up (e.g. scoring/suggestion quality over many days, section 7f empty state which requires deleting all restaurants/meals). Report a summary at the end grouped by section, listing any failures or unexpected behavior.
```

## Prerequisites

- App running locally (`npm run dev` or `docker-compose up`)
- Database migrated and accessible
- Start with an empty or known database state for predictable results

---

## 1. Navigation

| Step | Action | Look for |
|------|--------|----------|
| 1.1 | Load the app at `/` | Nav bar shows logo "PickMeADinner" and links: History, Calendar, Restaurants, Meals, Suggestions |
| 1.2 | Click each nav link | Correct page loads; active link is visually distinguished |
| 1.3 | Click the logo | Returns to home page |
| 1.4 | Resize browser to mobile width (<640px) | Nav links stack below the logo instead of sitting inline |
| 1.5 | Hover over nav links | Text turns pink on hover |

---

## 2. Restaurants Page (`/restaurants`)

### 2a. Add a restaurant

| Step | Action | Look for |
|------|--------|----------|
| 2a.1 | Navigate to `/restaurants` | "Restaurants" heading visible; "Add restaurant" form at top |
| 2a.2 | Submit the form with all fields empty | Name field is required — browser blocks submission |
| 2a.3 | Enter only a name (e.g. "Pizza Palace") and submit | Restaurant appears in the list below; form clears |
| 2a.4 | Add another with name, phone, order URL, menu URL, notes, and comma-separated tags | All fields display correctly in the collapsed summary: name, tags as teal pills, notes (italic, truncated), Call/Menu/Order links |
| 2a.5 | Verify Call link | Opens `tel:` handler with the phone number |
| 2a.6 | Verify Order link | Opens the order URL in a new tab |
| 2a.7 | Verify Menu link | Opens the menu URL in a new tab |

### 2b. Edit a restaurant

| Step | Action | Look for |
|------|--------|----------|
| 2b.1 | Click "Edit" on a restaurant | Details expand showing an edit form pre-filled with current values |
| 2b.2 | Change the name and submit | Details collapse; updated name shows in the list |
| 2b.3 | Clear optional fields and submit | Fields are removed; no stale data shown |

### 2c. Delete / Hide a restaurant

| Step | Action | Look for |
|------|--------|----------|
| 2c.1 | On a restaurant with no dinners, click "Delete" | Restaurant removed from the list |
| 2c.2 | On a restaurant that has dinners, look for delete button | "Delete" should NOT appear; "Hide" button shown instead |
| 2c.3 | Click "Hide" | Restaurant disappears from the main list |
| 2c.4 | Click "Show hidden restaurants" link | Hidden section appears with the hidden restaurant listed |
| 2c.5 | Click "Unhide" | Restaurant returns to the main list |
| 2c.6 | Click "Hide hidden restaurants" link | Hidden section disappears |

### 2d. Empty state

| Step | Action | Look for |
|------|--------|----------|
| 2d.1 | Delete/hide all restaurants | "No restaurants yet." message appears |

---

## 3. Meals Page (`/meals`)

### 3a. Add a meal

| Step | Action | Look for |
|------|--------|----------|
| 3a.1 | Navigate to `/meals` | "Homecooked meals" heading; "Add meal" form at top |
| 3a.2 | Submit with empty name | Browser blocks — name is required |
| 3a.3 | Add a meal with name, notes, and tags | Meal appears in list; tags shown as teal pills |
| 3a.4 | Confirm no phone/URL fields exist | Only name, notes, and tags fields in the form |

### 3b. Edit / Delete / Hide

| Step | Action | Look for |
|------|--------|----------|
| 3b.1 | Edit a meal — change name and notes | Updates reflected after collapse |
| 3b.2 | Delete a meal with no dinners | Removed from list |
| 3b.3 | Hide a meal that has dinners | Disappears from main list; appears in hidden section |
| 3b.4 | Unhide | Returns to main list |

---

## 4. Home Page — No Dinner Set (`/`)

| Step | Action | Look for |
|------|--------|----------|
| 4.1 | Navigate to `/` with no dinner set for today | "Tonight" section shows suggestions and a "Choose myself" link |
| 4.2 | Review suggestions | Up to 3 restaurants and 2 meals shown; each has name, "last ordered/cooked X days ago" label, tags with recency badge |
| 4.3 | Check restaurant suggestions | Should show Call and Order links (if the restaurant has phone/URL) |
| 4.4 | Click "Nah" on a suggestion | Suggestion disappears; a new one may appear if more are available |
| 4.5 | Click "Nah" on all suggestions | "No more suggestions — choose yourself" message appears |
| 4.6 | Click "Pick" on a suggestion | Redirects to `/add` with the suggestion pre-selected |
| 4.7 | Click "Choose myself" | Redirects to `/add?date={today}` |

---

## 5. Home Page — Dinner Set (`/`)

| Step | Action | Look for |
|------|--------|----------|
| 5.1 | Set a dinner for today (via `/add`), return to `/` | Tonight section shows the dinner name, type, and any notes |
| 5.2 | If restaurant has phone number | "Call" link visible |
| 5.3 | If restaurant has order URL | "Order" link visible |
| 5.4 | Click "Edit" on tonight's dinner | Redirects to `/add?id={dinnerId}` with form pre-filled |
| 5.5 | Click "Delete" on tonight's dinner | Dinner removed; suggestions reappear |
| 5.6 | Check "+ Add another" link | Links to `/add?date={today}` — allows multiple dinners per day |

---

## 6. Home Page — Past Dinners

| Step | Action | Look for |
|------|--------|----------|
| 6.1 | Scroll below tonight's section | "Last 14 nights" section listing recent dates in descending order |
| 6.2 | Days with no dinner | Shows "No dinner recorded" (muted text) and a "+ Add" link |
| 6.3 | Days with a dinner | Shows dinner name, type, notes, tags, and "Edit" link |
| 6.4 | Click "+ Add" on a past date | Redirects to `/add?date={thatDate}` |
| 6.5 | Click "Edit" on a past dinner | Redirects to `/add?id={dinnerId}` |
| 6.6 | Click "Load more" at the bottom | More days appear (14 additional); URL updates with `?days=28` |

---

## 7. Add Dinner Page (`/add`)

### 7a. Create mode — Restaurant

| Step | Action | Look for |
|------|--------|----------|
| 7a.1 | Navigate to `/add?date=2026-03-20` | "Set dinner" heading; date field pre-filled; "Restaurant" toggle active (pink) |
| 7a.2 | Verify dropdown | Lists all non-hidden restaurants alphabetically |
| 7a.3 | Select a restaurant, add optional notes, click Save | Redirects to `/`; dinner appears in tonight's section |

### 7b. Create mode — Homecooked

| Step | Action | Look for |
|------|--------|----------|
| 7b.1 | Click "Homecooked" toggle | Toggle switches — "Homecooked" is now pink; dropdown changes to meals |
| 7b.2 | Verify dropdown | Lists all non-hidden meals alphabetically |
| 7b.3 | Select a meal, click Save | Redirects to `/`; dinner shows as homecooked |

### 7c. Pre-selected suggestion

| Step | Action | Look for |
|------|--------|----------|
| 7c.1 | Navigate to `/add?date=2026-03-20&suggestedId={id}&type=RESTAURANT` | Correct restaurant pre-selected in dropdown; "Restaurant" toggle active |
| 7c.2 | Same with `type=HOMECOOKED` | Correct meal pre-selected; "Homecooked" toggle active |

### 7d. Edit mode

| Step | Action | Look for |
|------|--------|----------|
| 7d.1 | Navigate to `/add?id={existingDinnerId}` | Form pre-filled with the dinner's date, type, selection, and notes |
| 7d.2 | Date field should be read-only or hidden | Date is not editable in edit mode |
| 7d.3 | Change the selection and notes, click Save | Redirects to `/`; changes reflected |

### 7e. Inline create

| Step | Action | Look for |
|------|--------|----------|
| 7e.1 | Click "+ Add new restaurant" disclosure | Form expands with name, phone, order URL, menu URL fields |
| 7e.2 | Enter a restaurant name and submit | Details element collapses; new restaurant appears in the dropdown and is selected |
| 7e.3 | Switch to Homecooked, click "+ Add new meal" | Form shows name field only (no URL fields) |
| 7e.4 | Submit a new meal | Collapses; meal appears in dropdown |

### 7f. Empty state

| Step | Action | Look for |
|------|--------|----------|
| 7f.1 | With no restaurants, visit `/add` in Restaurant mode | Dropdown shows "No restaurants yet. Add one below."; Save button is disabled |
| 7f.2 | Same for Homecooked with no meals | "No meals yet. Add one below."; Save button disabled |

---

## 8. History Page (`/history`)

| Step | Action | Look for |
|------|--------|----------|
| 8.1 | Navigate to `/history` | "Dinner history" heading; quick-add date input at top |
| 8.2 | With dinners recorded | List of dinners sorted by date descending; each shows name, formatted date (with weekday), type, notes, tags |
| 8.3 | Click "Edit" on a dinner | Redirects to `/add?id={dinnerId}` |
| 8.4 | Click "Delete" on a dinner | Dinner removed from the list |
| 8.5 | Use the quick-add date input and click "Add" | Redirects to `/add?date={selectedDate}` |
| 8.6 | With >30 dinners | Pagination appears: "Page 1 of N", Next button |
| 8.7 | Click "Next" | Page 2 loads; "Previous" button appears |
| 8.8 | Click "Previous" | Returns to page 1 |
| 8.9 | With no dinners | "No dinners recorded yet." message |

---

## 9. Calendar Page (`/calendar`)

| Step | Action | Look for |
|------|--------|----------|
| 9.1 | Navigate to `/calendar` | "Calendar" heading; monthly grid for the current month; prev/next arrows |
| 9.2 | Days with a dinner recorded | Dinner name shown in the cell; pink text for restaurants, teal for homecooked |
| 9.3 | Days with tags | Tags shown as small teal chips below the name; chips clip at the cell boundary without overflow |
| 9.4 | Today's date | Cell has a teal dashed border and teal day number |
| 9.5 | Click the "←" arrow | Previous month loads; URL updates to `?month=YYYY-MM` |
| 9.6 | Click the "→" arrow | Next month loads |
| 9.7 | Navigate to a month with no dinners (use a far-future month e.g. `/calendar?month=2027-06` if DB has extensive history) | Grid shows only day numbers; all cells are empty |
| 9.8 | Click any day cell | Redirects to `/add` (for tonight, not the clicked date) |
| 9.9 | Check the legend at the bottom | "Pink = restaurant · Teal = homecooked · click any day to add tonight's dinner" |

---

## 10. Suggestions Page (`/suggestions`)

| Step | Action | Look for |
|------|--------|----------|
| 10.1 | Navigate to `/suggestions` | "Suggestions" heading |
| 10.2 | With restaurants and meals | "Restaurants" section (up to 5) and "Homecooked" section (up to 3) |
| 10.3 | Each suggestion | Name (clickable), last ordered/cooked label, tags with recency, Pick button |
| 10.4 | Restaurant suggestions | Also show Call and Order links if applicable |
| 10.5 | Click "Pick" | Redirects to `/add` with suggestion pre-filled |
| 10.6 | Click "Nah" | Suggestion disappears from list |
| 10.7 | Nah all suggestions | Section disappears |
| 10.8 | With no restaurants or meals | "No restaurants or meals added yet." |

---

## 11. Scoring & Suggestion Quality

| Step | Action | Look for |
|------|--------|----------|
| 11.1 | Add several restaurants, use one today | That restaurant should NOT appear at the top of suggestions tomorrow |
| 11.2 | Leave a restaurant unused for many days | It should rise to the top of suggestions |
| 11.3 | Use a restaurant with a tag (e.g. "pizza"), then check other "pizza"-tagged restaurants | Tag-aware scoring: other pizza restaurants may also be ranked lower due to recent tag use |
| 11.4 | Refresh suggestions multiple times | Picks from the highest-scoring tier are random — order may vary |
| 11.5 | Scoring caps at 21 days | After 21+ days unused, items should have equal max score |

---

## 12. Cross-Cutting Concerns

| Step | Action | Look for |
|------|--------|----------|
| 12.1 | Click any navigation link or action button | Loading spinner appears during navigation/submission |
| 12.2 | Submit any form | Submit button shows spinner while pending; prevents double-submit |
| 12.3 | Check all external links (Order, Menu) | Open in new tab (`target="_blank"` or equivalent) |
| 12.4 | Check all Call links | Use `tel:` protocol |
| 12.5 | Test on mobile viewport | Layout is responsive; forms are usable; nav stacks properly |
| 12.6 | Check dark mode (if OS is set to dark) | Colors adapt; text remains readable; no broken contrast |
| 12.7 | Verify page titles / heading hierarchy | Each page has a clear heading; no duplicate h1 tags |
| 12.8 | Try navigating directly to `/add` with no query params | Should default to today's date and Restaurant type |
| 12.9 | Check browser console for errors | Zero errors in console throughout the session |
