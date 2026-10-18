# Primary Persona — Thandiwe Mokoena

> **Persona type:** Non-visual screen reader user (primary), keyboard-only input
> **Domain:** Pretoria Public Library — Adaptive Learning & Resource Portal
> **Ticket:** MD-2026-0143

---

## 1. Profile

| Attribute | Detail |
|---|---|
| Age | 46 |
| Occupation | Part-time administrative clerk; returning adult learner |
| Location | Lives 4 km from the main library branch; travels by e-hailing taxi or with a sighted family member |
| Vision | Blind since age 31 (retinitis pigmentosa). Light perception only — no functional use of a screen |
| Digital literacy | Advanced screen reader user (15 years). Confident with keyboard shortcuts, but not a "power user" of web technology |
| Languages | English (web), isiZulu (home). Uses English synthesiser voice on the web |

> *"I don't need the website to be pretty. I need it to tell me the truth about what's on the page and what just happened when I pressed a button."*

---

## 2. Technical Configuration

| Layer | Primary setup (home) | Secondary setup (mobile / work) |
|---|---|---|
| Device | Windows 11 laptop, 15" | iPhone 13 (iOS 18) |
| Screen reader | **NVDA 2025.x** (free, community-supported) | **VoiceOver** (iOS); **JAWS 2025** on work PC |
| Browser | Firefox (latest), Chrome as fallback | Safari |
| Speech | eSpeak NG → Microsoft OneCore voice, rate ~75% (fast) | VoiceOver at 70% rate |
| Braille | Focus 14 Blue refreshable braille display (used for checking spelling of reference numbers and dates) | Paired via Bluetooth occasionally |
| Verbosity | Punctuation: "some"; reports landmarks, headings, form fields, live regions | Hints on |
| Display | Screen curtain on (no visual output) | Screen curtain on |

### Input modalities

- **Keyboard only** — never uses a mouse. Relies on `Tab` / `Shift+Tab`, arrow keys, `Enter`, `Space`, `Esc`.
- **NVDA browse-mode quick keys:** `H` (next heading), `1`–`3` (heading levels), `D` (next landmark), `F` (next form field), `B` (next button), `K` (next link), `Insert+F7` (Elements List for headings/links/landmarks).
- **Focus mode** for forms (NVDA switches automatically when entering an input).
- **Touch gestures** (VoiceOver rotor, swipe navigation) on iPhone.

---

## 3. Context & Motivation

Thandiwe wants to complete a free **Digital Skills for Work** course offered by the library so she can apply for a full-time role. She also needs a **quiet study room** with a screen-reader-equipped PC twice a week, and enjoys **audio-described community events** with her teenage son.

She currently phones the library to book everything because the old website is "a maze of unlabelled buttons". Phone lines are only open 09:00–16:00, which clashes with her work hours.

---

## 4. Primary Goals

1. **Find** a course, event or study room that meets her access needs (captions not needed; *screen-reader tested* and *step-free access* are essential).
2. **Filter** results quickly without having to re-read the whole page after every change.
3. **Book or register** independently, in under five minutes, and receive a reference number she can copy to braille.
4. **Know immediately** when something goes wrong (a mistyped library card number, a date in the past) and know exactly how to fix it.
5. **Trust** the confirmation — she needs an unambiguous statement that the booking succeeded.

---

## 5. Pain Points With Conventional Web Design

| # | Pain point | What she experiences | Design implication for this project |
|---|---|---|---|
| 1 | **No skip link / no landmarks** | Has to tab through 40+ navigation links on every page | Visible-on-focus "Skip to main content" link; `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>` landmarks |
| 2 | **Unlabelled icon buttons** | Hears "button, button, button" for filter and close icons | Every control has a visible text label or an accessible name that contains its visible text |
| 3 | **Silent filtering** | Clicks a filter and hears nothing; doesn't know if results changed | Polite live region: "4 of 12 resources shown" |
| 4 | **Toggle state hidden in colour** | Cannot tell which category chip is "on" | `aria-pressed` on toggle buttons; `aria-expanded` on accordions |
| 5 | **Placeholder-only form labels** | Label disappears as she types; NVDA reads nothing useful | Persistent `<label for>` on every input; hints via `aria-describedby` |
| 6 | **Errors shown only in red** | Submits, nothing is announced, form appears to "do nothing" | Error summary receives focus; each field gets `aria-invalid` and a linked error message |
| 7 | **Modals that leak focus** | Tabs "behind" a pop-up and gets lost in the page underneath | Focus moved into dialog, trapped while open, `Esc` closes, focus returned to trigger |
| 8 | **Single-page apps that don't move focus** | Activates a nav link; page changes visually but NVDA stays on the old link | On every view switch, focus moves to the new page's `<h1>` and `document.title` updates |
| 9 | **Custom date pickers** | Calendar grids that cannot be operated by keyboard | Native `<input type="date">` with a typed-format hint |
| 10 | **Time-outs** | Session expires while she reviews her details | No time limits on the booking form |

---

## 6. Scenario Walk-Through (Target Experience)

1. Opens the portal; NVDA reads the page title *"Home | Pretoria Public Library"*.
2. Presses `Tab` once → hears *"Skip to main content, link"* → `Enter` → focus lands on `<main>`.
3. Presses `D` to jump to the *Main* navigation landmark, then activates *"Find resources"*. Focus moves to the heading *"Find learning resources, heading level 1"*.
4. Types "digital" into the search field. After a short pause NVDA announces *"2 of 12 resources shown"*.
5. Tabs to *"Study rooms, toggle button, not pressed"*, presses `Space` → *"pressed"*; the result count is announced again.
6. Opens *"More filters, collapsed"* → `Enter` → *"expanded"*; ticks *"Screen-reader tested"*.
7. Activates *"View details for Digital Skills for Work"*. A dialog opens: *"Digital Skills for Work, dialog, heading level 2"*. `Tab` cycles inside the dialog only.
8. Activates *"Enrol in this course"*. Focus moves to *"Book or register, heading level 1"* with the course pre-selected.
9. Submits with a 7-digit card number. Focus jumps to *"There is a problem, 1 error"*; she follows the link straight to the card number field, which reads *"Library card number, invalid entry, Your library card number must be exactly 8 digits"*.
10. Fixes it, submits, hears *"Booking confirmed"* followed by her reference number, which she checks on her braille display.

---

## 7. Success Metrics For This Persona

- Completes a booking **without sighted assistance** in ≤ 5 minutes.
- **Zero** moments where focus is lost or she cannot tell what changed.
- Every state change (filter, toggle, expand, error, success) produces **one** clear spoken confirmation — not zero, not three.

---

## 8. Secondary Persona Considerations (not primary, but designed for)

- **Motor-impaired keyboard / switch user** (e.g. tremor): large 44×44 px targets, no hover-only content, no time limits.
- **Low-vision magnifier user** (ZoomText at 400%): content reflows to a single column at 320 CSS px; focus ring always visible at high zoom.
