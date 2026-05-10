# NeuroScan AI — Design System

## Overview

Clean modern medical dashboard aesthetic. Soft blue-gray page background, pure white cards, blue gradient accent. Light mode only.

**Font:** Inter (loaded via Google Fonts in `index.html`)  
**Icon library:** lucide-react  
**Source file:** `frontend/src/styles/theme.css`

---

## Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--bg-page` | `#EBF0F8` | Page/app background |
| `--bg-card` | `#FFFFFF` | Card and panel backgrounds |
| `--bg-input` | `#F4F7FC` | Input field background (unfocused) |
| `--accent-solid` | `#3B82F6` | Blue — links, icons, focus rings |
| `--accent-light` | `#EBF3FF` | Soft blue — secondary button bg |
| `--accent-lighter` | `#F0F6FF` | Very soft blue — hover states |
| `--gradient-accent` | `linear-gradient(135deg, #4B8EF1, #2563EB)` | Primary buttons, active nav pill, logo |
| `--gradient-card` | `linear-gradient(135deg, #4B8EF1 0%, #2563EB 100%)` | Login/Register left panel |
| `--cn-color` | `#10B981` | Cognitively Normal — green |
| `--cn-bg` | `#ECFDF5` | CN badge / completed badge background |
| `--mci-color` | `#F59E0B` | Mild Cognitive Impairment — amber |
| `--mci-bg` | `#FFFBEB` | MCI badge background |
| `--ad-color` | `#EF4444` | Alzheimer's Detected — red |
| `--ad-bg` | `#FEF2F2` | AD badge / failed badge background |
| `--text-primary` | `#1E293B` | Headings, values, primary labels |
| `--text-secondary` | `#64748B` | Body text, descriptions |
| `--text-muted` | `#94A3B8` | Placeholders, timestamps, tertiary labels |
| `--border` | `#E2E8F0` | Visible borders |
| `--border-light` | `#F1F5F9` | Subtle dividers, progress track bg |

---

## Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-card` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | Default card resting state |
| `--shadow-hover` | `0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)` | Card on hover (lifts) |
| `--shadow-sidebar` | `2px 0 8px rgba(0,0,0,0.06)` | Fixed left sidebar |

---

## Border Radii

| Token | Value |
|---|---|
| `--radius-sm` | `4px` |
| `--radius-md` | `12px` |
| `--radius-lg` | `16px` — cards |
| `--radius-xl` | `20px` — sidebar |
| `--radius-full` | `9999px` — pills, buttons, badges |

---

## Utility Classes

### Cards
```
.card
```
White bg, `--shadow-card`, `--radius-lg`, 20px 24px padding. Hover lifts to `--shadow-hover`.

### Buttons
```
.btn-primary    — gradient-accent bg, white text, pill shape
.btn-secondary  — accent-light bg, accent-solid text, pill shape
```
Both use `display: inline-flex; align-items: center; gap: 8px` so icons sit inline with text.  
Disabled state: `opacity: 0.5; cursor: not-allowed`.

### Inputs
```
.input-field
```
`--bg-input` background, 1.5px transparent border (turns `--accent-solid` on focus), `--radius-md`. Background turns white on focus.

### Badges
```
.badge-cn           — green pill (CN result)
.badge-mci          — amber pill (MCI result)
.badge-ad           — red pill (AD result)
.badge-pending      — gray pill
.badge-processing   — blue pill
.badge-completed    — green pill (same as cn)
.badge-failed       — red pill (same as ad)
```
All pills: `--radius-full`, 4px 12px padding, 12px font-size, font-weight 600 (result) / 500 (status).

### Avatars
```
.avatar
```
40×40px circle, `--accent-light` bg, `--accent-solid` text, 13px 600 weight. Shows 2-letter initials.

### Progress bars
```
.progress-track          — track (border-light bg, 6px height)
.progress-fill-cn        — green fill, spring easing (cubic-bezier 0.34,1.56,0.64,1)
.progress-fill-mci       — amber fill, spring easing
.progress-fill-ad        — red fill, spring easing
.progress-fill-accent    — gradient-accent fill, linear ease
```
All fills animate `width` from 0 — set initial width to `"0%"` then use `setTimeout(..., 50)` to trigger animation.

### Stat change pills
```
.stat-change-up    — green text on green bg
.stat-change-down  — red text on red bg
```

### Animations
```
.page-enter   — 200ms fade-in + 6px translateY on mount
.spin         — 1s linear infinite rotation (used on Loader2 spinner icon)
.pulse        — 1.5s opacity pulse (used on processing badges)
```

---

## Layout

### Sidebar (`Layout.jsx`)
- Fixed, left edge, 72px wide, full viewport height
- Background: `--bg-card`, `--shadow-sidebar`, `border-radius: 0 20px 20px 0`
- Logo: 48×48px gradient-accent rounded square (`--radius-md`), Brain icon white
- Nav: 4 icon-only buttons (44×44px circles). Active = gradient-accent circle + `box-shadow: 0 4px 12px rgba(59,130,246,0.4)` blue glow. Hover = `--accent-lighter` bg.
- Doctor avatar: 44×44px gradient-accent circle, initials in white, pinned to bottom
- Hidden on mobile — replaced by bottom tab bar

### Top Bar
- Greeting: "Good morning/afternoon/evening, Dr. {firstName} 👋" at 20px 600
- Subtitle: "Your progress this week is great" at 14px muted
- Center: search pill — white card, `--shadow-card`, `--radius-full`, Search icon + text input
- Right: bell button (40×40px white circle) with red dot if pending analyses; doctor gradient avatar

### Content Area
- `margin-left: 72px`, background `--bg-page`
- Header padding: `24px 32px 0 32px`
- Main padding: `0 32px 32px 32px`

### Mobile (`< 768px`)
- Sidebar hides (`display: none`)
- Content area: `margin-left: 0`, `padding-bottom: 80px`
- Search pill hides (`display: none`)
- Bottom tab bar shows: fixed bottom, white bg, `box-shadow: 0 -2px 8px rgba(0,0,0,0.06)`, 4 tab buttons with icon + label

---

## Pages

### Login & Register
Two-panel layout:
- **Left panel** (45% width, hidden mobile): `--gradient-card` bg, Brain icon, tagline, feature checklist with CheckCircle2 icons, decorative translucent circles
- **Right panel** (flex: 1): white bg, centered form, max-width 420px

Form elements use `.input-field`. Submit button uses `.btn-primary` full width.  
Error alert: `--ad-bg` background with AlertCircle icon.  
Password strength bar (Register): 4 levels — Weak (#EF4444), Fair (#F59E0B), Good (#10B981), Strong (#2563EB).

### Dashboard
- **Row 1** — 3 stat cards (`grid-cols-3`): Total patients, Total analyses, AD detected
  - Numbers animate via `useCountUp()` hook (requestAnimationFrame, ease-out cubic)
  - Icon in colored 44px rounded square: blue (#EFF6FF), green (#F0FDF4), red (#FEF2F2)
- **Row 2** — 65/35 grid:
  - Analytics card: Recharts BarChart with SVG gradient (`#4B8EF1 → #2563EB`), 7-day data, custom tooltip
  - Right column: Result distribution progress bars + Quick actions (2 buttons)
- **Row 3** — Recent analyses table: avatar + name + date + status badge + result badge + confidence bar + View link

### Patients
- Search input + "Add patient" button in header
- Patient card grid: `auto-fit minmax(280px, 1fr)`, each `.card` with avatar, name, last result badge, DOB, "View →" link
- Add Patient modal: centered overlay, `.card` with `.input-field` fields

### Patient Detail
- Hero `.card`: 64×64px gradient avatar, name, DOB/gender, "New Analysis" button
- Analysis history: each `.card` row — date, status badge, result badge, confidence bar, "View →" link
- Empty state: Brain icon + "No analyses yet" + button

### Upload (3-step stepper UI)
- Step indicator: gradient-accent circles for completed steps, Loader2 for active, muted circles for future
- Drop zones: `--bg-input` background, dashed `--accent-solid` border
- File dropped state: `.card` with CheckCircle2 + filename + remove button
- Navigation: Back (`.btn-secondary`) + Next/Submit (`.btn-primary`)

### Result
- **Loading**: 80px spin circle, 3-step progress list (CheckCircle2 / Loader2 / Circle, advances every 2s)
- **Completed**: 80px colored icon circle, result label, `.badge-{result}`, confidence progress bar, feature importance bars with staggered delay
- **Failed**: XCircle icon, error message, Try again + Back buttons
- Disclaimer box: AlertCircle icon + research-only disclaimer text

---

## Toast Notifications (`ToastContext.jsx`)

```jsx
const { showToast } = useToast()
showToast(message, type, title)
// type: 'success' | 'error' | 'info' | 'warning'
```

Toasts stack in top-right corner. Enter/exit animation: `translateX(0 → 120%)`. 4s auto-dismiss.  
Border-left color: green (success), red (error), blue (info), amber (warning).

Fires on: patient create success, analysis submit, analysis complete (Result.jsx), auth error, social login placeholder.

---

## Typography Scale

| Size | Weight | Usage |
|---|---|---|
| 22–28px | 700 | Page titles, stat values |
| 20px | 600 | Top bar greeting |
| 18–20px | 600 | Card section titles |
| 16px | 600 | Sub-section headings |
| 14px | 400–500 | Body text, button labels, input text |
| 13px | 400–500 | Table cells, secondary labels |
| 12px | 400–600 | Badges, timestamps, captions |
| 10–11px | 400–500 | Mobile tab labels, uppercase column headers |

Column headers use `font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 500`.
