# Pretoria Library Access Hub

**Adaptive Learning & Resource Portal — accessible React prototype**
Ticket **MD-2026-0143** · Marlowe Digital · Domain: Local Public Library.

A keyboard- and screen-reader-first single-page app for finding and booking library courses, study rooms, digital archive sessions and events. Built to WCAG 2.1 AA with Vite + React 18 and no UI libraries, so every accessibility behaviour is explicit and auditable.

```
├── wireframes/          persona.md, wcag-matrix.md, 3 static HTML pages, main.css (zero JavaScript)
├── src/
│   ├── components/      Layout, Navigation (+ skip link), LiveForm, ResourceDirectory, Modal
│   ├── data/            Library catalogue data
│   ├── __tests__/       axe-core + Testing Library suites (app and wireframes)
│   ├── App.jsx          Hash routing, view-switch focus management, page titles
│   ├── index.css        Design tokens, focus rings, contrast-audited palette
│   └── main.jsx
├── index.html  ·  package.json  ·  vite.config.js  ·  netlify.toml
└── README.md            
```

---

## 1. Local Setup Instructions

Requires **Node.js 18+** and npm.

```bash
git clone https://github.com/<your-username>/pretoria-library-access-hub.git
cd pretoria-library-access-hub
npm install          # install dependencies
npm run dev          # start the dev server at http://localhost:5173
npm test             # run the axe-core + keyboard/ARIA test suites (23 tests)
npm run build        # production build into /dist
npm run preview      # serve the production build locally
```

The wireframes need no tooling: open `wireframes/index.html` directly in a browser.
**Deployment:** `netlify.toml` builds with `npm run build` and publishes `dist/`. Because `vite.config.js` uses `base: './'`, the same build also works on GitHub Pages or Vercel.

---

## 2. Accessibility Trade-Off Analysis

**Trade-off 1 — Native controls over custom widgets.** A custom styled dropdown and calendar picker would match a brand more closely, but each would need a hand-built listbox or grid with roving `tabindex`, typeahead and screen-reader testing across NVDA, JAWS and VoiceOver. A native `<select>` with `<optgroup>` and a native `<input type="date">` are used instead. Browsers already expose correct roles, states and keyboard behaviour, and mobile users get the platform picker. The cost is limited visual control and inconsistent date-field announcements between browsers, which is offset with a hint that the date can simply be typed as YYYY-MM-DD and with server-side-style validation of the typed value.

**Trade-off 2 — Focus trap in the modal vs. free keyboard flow.** Trapping focus can feel restrictive and, done badly, *is* a keyboard trap (WCAG 2.1.2). Not trapping it lets keyboard and screen-reader users wander into content hidden behind the overlay. A strict trap with three guaranteed exits was is chosen: `Esc`, a visible text **Close** button (no icon-only "×"), and a backdrop click. The app root also gets `inert` and `aria-hidden` while the dialog is open, so the virtual cursor cannot reach background content either. Focus returns to the exact "View details" button that opened the dialog.

**Trade-off 3 — Live-region verbosity vs. silence.** Announcing every change is as harmful as announcing nothing. The results count is announced through a polite region only after a 600 ms pause, so typing "digital" produces one announcement instead of seven, while the visible count updates instantly. Form errors are announced once on blur, but not again on each corrective keystroke; the error simply clears. On a failed submit *focus is moved* to the error summary rather than also pushing it through a live region, because doing both makes NVDA read the same errors twice.

---

## 3. Assistive Tech State Architecture

React state is the single source of truth, and each accessibility attribute is derived from it during render, so the accessibility tree can never drift from what is shown visually.

| React state / ref | DOM / accessibility tree effect |
|---|---|
| `activeCategories` (`useState`) | `aria-pressed={activeCategories.includes(id)}` on each category toggle; "All resources" is pressed when the array is empty |
| `filtersOpen` (`useState`) | `aria-expanded={filtersOpen}` on the disclosure button, `hidden={!filtersOpen}` on the panel it names with `aria-controls` |
| `isPending` + `announcement` (`useState` + `setTimeout`) | `aria-busy` on the results list while the count is settling, then the text of the `role="status"` / `aria-live="polite"` region |
| `errors` (`useState`) | `aria-invalid={!!errors.field}`; the error's id is appended to `aria-describedby` only when an error exists |
| `status` + `submitCount` | `aria-busy` on the form and `aria-disabled` on the submit button while sending; `useEffect` calls `errorSummaryRef.current.focus()` or `successHeadingRef.current.focus()` |
| `route` (hash router) | `aria-current="page"` on the nav link, `document.title`, and `headingRef.current.focus()` on the new `<h1 tabIndex={-1}>` |
| `mainRef` (`useRef`) | Skip link calls `mainRef.current.focus()` on `<main tabIndex={-1}>` |
| Modal `titleRef` / `dialogRef` | Focus moves to the dialog title on open; a `keydown` listener cycles Tab within `dialogRef`; the trigger is refocused on close |

Two details matter in practice. First, `aria-disabled` is used instead of `disabled` while sending, because disabling the focused button drops focus to `<body>`. Second, live regions are mounted before their text changes, and the form's region sits outside the form/confirmation swap, because screen readers often ignore a region that is inserted already filled.

---

## 4. Verification & Testing Audit

### 4.1 Automated testing (axe-core 4.10, run with `npm test`)

All suites pass: **23 / 23 tests, 0 axe violations** across WCAG 2.0/2.1 A and AA plus best-practice rules.

| Suite | What is checked | Result |
|---|---|---|
| App shell | axe on Home and Find resources views; landmarks; single `<h1>`; skip link is first tab stop; `aria-current`; focus moves to new `<h1>`; page title | Pass |
| ResourceDirectory | axe; `aria-pressed` and `aria-expanded` flip on click and keyboard; live region text; modal focus-in, Tab wrap both ways, `Esc`, focus restore; axe inside the open dialog | Pass |
| LiveForm | axe in initial **and** error states; every control labelled; `aria-invalid` and `aria-describedby`; error summary focus and links; blur announcement; success focus and announcement | Pass |
| Wireframes (×3) | No `<script>` or inline handlers; all seven landmark elements present; axe on each page | Pass |

jsdom has no rendering engine, so axe's `color-contrast` rule is disabled in these tests. Contrast is covered by the computed ratios documented in `main.css` and `index.css` (lowest text pair: 5.42:1) and by the Lighthouse run below.

### 4.2 Lighthouse methodology

Run `npm run build && npm run preview`, open the URL in Chrome Incognito, then go to DevTools → Lighthouse → Accessibility → Desktop and Mobile. Audit `#/`, `#/catalog` and `#/book`, including `#/book` after an empty submit. The target is **100**. Record the scores and attach report screenshots in `docs/` before submission.

| View | Desktop | Mobile |
|---|---|---|
| Home `#/` | ___ / 100 | ___ / 100 |
| Find resources `#/catalog` | ___ / 100 | ___ / 100 |
| Book `#/book` (error state) | ___ / 100 | ___ / 100 |

### 4.3 Manual screen-reader test script (NVDA 2025 + Firefox, VoiceOver + Safari)

| # | Action | Expected announcement / behaviour | Result |
|---|---|---|---|
| 1 | Load page, press `Tab` | "Skip to main content, link" (visible yellow tab) | ☐ |
| 2 | `Enter` on skip link, then `Tab` | Focus inside `<main>`; next stop is "Find resources" | ☐ |
| 3 | `D` / VO rotor → Landmarks | banner, Main navigation, main, complementary, content info | ☐ |
| 4 | Activate "Find resources" | "Find learning resources, heading level 1"; title updates | ☐ |
| 5 | Type "digital", pause | "4 of 12 resources shown" (once) | ☐ |
| 6 | `Space` on "Study rooms" | "Study rooms, toggle button, pressed", then new count | ☐ |
| 7 | `Enter` on "More filters" | "More filters, button, expanded" | ☐ |
| 8 | Activate "View details for Quiet Study Room A" | "Quiet Study Room A, dialog, heading level 2" | ☐ |
| 9 | `Tab` ×5 in dialog, then `Esc` | Focus cycles Close → action → Close; `Esc` returns to "View details…" | ☐ |
| 10 | Submit empty booking form | "There is a problem with your booking: 7 errors" | ☐ |
| 11 | Follow "Enter your library card number." link | "Library card number, edit, invalid entry, 8 digits…, Error: …" | ☐ |
| 12 | Enter 4 digits, `Tab` away | "Library card number: Your library card number must be exactly 8 digits." | ☐ |
| 13 | Complete and submit | "Booking confirmed, heading level 2", then reference read character by character | ☐ |

### 4.4 Keyboard tab-sequence log (Find resources view)

Skip link → site title → Home → Find resources → Book or register → search field → All resources → Courses → Digital archives → Events → Study rooms → More filters → [Format and feature checkboxes when expanded] → Clear all filters → View details (×12, in visual order) → sidebar phone link → footer links. No positive `tabindex` is used, there are no traps outside the modal, and the focus ring is visible at every stop at 100% and 400% zoom.

---

## 5. Future Technical Improvements

1. **Continuous real-browser auditing.** Add Playwright with `@axe-core/playwright` and Lighthouse CI in GitHub Actions, so contrast, reflow at 320 px and focus visibility are checked in Chromium, Firefox and WebKit on every pull request, with a failing build below a score of 100.
2. **Personal accessibility profile.** A persisted preferences panel (React context and server storage) for text size, line spacing, reduced motion, a high-contrast theme and live-announcement verbosity ("brief" vs "detailed"), so users like the primary persona can tune feedback.
3. **Internationalisation.** Extract strings with `react-intl`, add isiZulu, Afrikaans and Sesotho, set `lang` per locale, and use locale-aware date formats so hints and errors match the screen reader's voice language.
4. **Real API and optimistic availability.** Replace the static catalogue with the library API, add `aria-busy` loading skeletons, and announce live availability changes ("2 places left") politely.
5. **Router upgrade.** Move to React Router with a shared `useRouteFocus` hook and scroll restoration once the app grows beyond three views.
