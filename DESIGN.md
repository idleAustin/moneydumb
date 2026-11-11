---
name: MoneyDumb
description: High-velocity personal cash-flow and debt-payoff command center in the idleAustin Pure Obsidian system
colors:
  electric-lime: "#84cc16"
  electric-lime-deep: "#65a30d"
  lime-ink: "#1a2e05"
  obsidian-void: "#0a0a0c"
  obsidian-surface: "#121216"
  obsidian-elevated: "#18181f"
  obsidian-overlay: "#202029"
  border-subtle: "#22222a"
  border-strong: "#33333f"
  text-primary: "#f4f4f5"
  text-secondary: "#a1a1aa"
  text-muted: "#71717a"
  status-success: "#10b981"
  status-warning: "#f59e0b"
  status-error: "#f43f5e"
  status-info: "#38bdf8"
typography:
  display:
    fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0em"
  label:
    fontFamily: "Geist, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.04em"
  mono:
    fontFamily: "Fira Code, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "-0.01em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "10px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.electric-lime}"
    textColor: "{colors.lime-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 18px"
  button-primary-hover:
    backgroundColor: "{colors.electric-lime-deep}"
    textColor: "{colors.lime-ink}"
  button-secondary:
    backgroundColor: "{colors.obsidian-elevated}"
    textColor: "{colors.text-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 18px"
  button-ghost:
    backgroundColor: "{colors.obsidian-void}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
  card-surface:
    backgroundColor: "{colors.obsidian-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "24px"
  input-field:
    backgroundColor: "{colors.obsidian-void}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
    height: "44px"
---

# Design System: MoneyDumb

## Overview

**Creative North Star: "The Obsidian Cockpit"**

MoneyDumb implements the `idleAustin` design language for high-stakes personal financial operations: a four-tier solid obsidian surface hierarchy (`#0a0a0c` through `#202029`), crisp `1px` structural hairlines, tabular monospace telemetry, and a single surgical Electric Lime (`#84cc16`) signal color. Rather than disguising financial stress behind pastel fintech illustrations or decorative glassmorphism, the interface behaves like a calm, precision instrument panel built for payday bill execution and debt amortization.

Density is deliberate and task-governed. Working screens (`This Month`, `Debts`, `Expenses`, `Income`, `Accounts`) keep related numbers tightly grouped with generous structural intervals between regions so the eye can scan balances, due dates, and post-obligation safe cash in a single pass. Every interactive surface rejects ornamental blur, glowing ambient orbs, emojis, and exclamation points in favor of crisp vector iconography and deadpan, unambiguous microcopy.

**Key Characteristics:**
- Four-step monotonic Pure Obsidian luminance ladder with zero `backdrop-filter: blur` glassmorphism and zero decorative orbs.
- Restrained Electric Lime accent reserved for primary actions, active route/tab selection, focus rings, and positive safe-cash emphasis.
- Tri-voice typographic system pairing `Outfit` structural headings, `Geist` UI copy, and `Fira Code` tabular financial numerals.
- Geometric `2.0px`-stroke Lucide vector icons with accessible names and hover-safe tooltips; zero emojis or icon fonts.
- Snappy `100ms–150ms` `cubic-bezier(0.16, 1, 0.3, 1)` state transitions with reduced-motion fidelity.

## Colors

The palette pairs cool, blue-undertoned obsidian neutrals with a high-visibility Electric Lime primary signal and four semantic status channels.

### Primary
- **Electric Lime** (`--as-accent-primary`): Used for primary CTA fills, active navigation bars, `:focus-visible` outlines, active filter chips, and safe-cash surplus callouts.
- **Pressed Lime** (`--as-accent-hover`): Hover and active state shift for solid Electric Lime buttons.
- **Deep Forest Ink** (`--as-accent-text`): Foreground label color exclusively atop solid Electric Lime fills, delivering 7.42:1 AAA contrast.

### Secondary
- **Emerald Clear** (`--as-status-success`): Cleared obligations, inbound deposits, and funded envelope progress bars.
- **Amber Due** (`--as-status-warning`): Obligations due within 7 days, elevated utilization warnings, and windfall caution states.
- **Rose Deficit** (`--as-status-error`): Negative safe-cash balances, overdue bills, high-APR debt callouts, and destructive delete confirmations.
- **Sky Telemetry** (`--as-status-info`): Checking/liquidity breakdowns, Snowball strategy indicators, and informational callouts.

### Neutral
- **Obsidian Void** (`--as-bg-base`): Page canvas, recessed form inputs, and progress bar tracks.
- **Obsidian Surface** (`--as-bg-surface`): Primary cards, sidebar chrome, table bodies, and workspace strips.
- **Obsidian Elevated** (`--as-bg-elevated`): Sticky table headers, secondary buttons, hovered rows, and modal dialogs.
- **Obsidian Overlay** (`--as-bg-overlay`): Command palette active items, floating popups, and tooltips.
- **Subtle Hairline & Strong Hairline** (`--as-border-subtle`, `--as-border-strong`): `1px` structural dividers and interactive hover/modal boundaries.
- **Zinc Chalk, Zinc Ash & Muted Slate** (`--as-text-primary`, `--as-text-secondary`, `--as-text-muted`): Three-tier readable foreground hierarchy tuned for dark grounds.

### Named Rules
**The One Signal Rule.** Electric Lime owns primary action, active selection, and keyboard focus; never scatter it as decorative borders or background washes across inactive cards.

**The Semantic Pairing Rule.** Status colors (`success`, `warning`, `error`, `info`) never communicate state by hue alone—always pair them with explicit text (`Cleared`, `Overdue`, `−$420.00`) or a distinct geometric icon.

## Typography

**Display Font:** `Outfit` (with `-apple-system, BlinkMacSystemFont, sans-serif` fallback)
**Body Font:** `Geist` (with `-apple-system, BlinkMacSystemFont, sans-serif` fallback)
**Label/Mono Font:** `Fira Code` (with `monospace` fallback)

**Character:** Geometric, tight-tracked `Outfit` anchors page and section landmarks without editorial ornament, `Geist` handles dense operational controls and prose cleanly on dark grounds, and `Fira Code` locks every dollar figure, percentage, date badge, and shortcut key onto a rigid tabular grid.

### Hierarchy
- **Display** (`800`, `2.25rem`, `line-height: 1.1`, `-0.03em`): Public authentication wordmark (`MONEY_DUMB`) only.
- **Headline** (`700`, `1.35rem–1.5rem`, `line-height: 1.2`, `-0.025em`): Page titles and active month workspace headers, set with `text-wrap: balance`.
- **Title** (`600`, `0.9rem–1.05rem`, `line-height: 1.35`, `-0.01em`): Card headers, modal titles, and drawer headings.
- **Body** (`400–500`, `0.85rem–0.875rem`, `line-height: 1.55`, max measure `65ch` on prose): Table labels, helper descriptions, and modal copy, set with `text-wrap: pretty`.
- **Label** (`600`, `0.72rem–0.75rem`, `letter-spacing: 0.04em`): Form field labels, table column headers, and filter chips—never placed as decorative eyebrows above headings.
- **Mono Telemetry** (`500–700`, `0.75rem–1.75rem`, `font-variant-numeric: tabular-nums`): Currency cells, APRs, safe-cash KPIs, due dates, and `.kbd` badges.

### Named Rules
**The Tabular Money Rule.** Every currency amount, percentage, due day, and countdown renders in `Fira Code` with `font-variant-numeric: tabular-nums` and right-alignment inside table columns so decimal points align vertically.

**The Readable Floor Rule.** Operational metadata and badges stay at or above `11px` (`0.6875rem`), reserving `10px` (`0.625rem`) strictly for `.kbd` keycap badges; mobile text inputs always render at `16px` (`1rem`) to prevent forced iOS viewport zoom.

## Layout

Desktop routes run inside a persistent left navigation rail (`240px` expanded, `56px` collapsed) paired with a fluid `.main-content` workspace (`32px 36px` padding, `max-width: 1600px` centered container ceiling on ultra-wide monitors). Within each route, a persistent `.top-telemetry-bar` anchors engine status (`idleAustin (idle, but operational)`) and the `⌘K` command trigger above the `.page-header`.

Spacing follows a `4px` base rhythm (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`): tight `4px–8px` internal gaps bind labels to values, `12px–16px` separates sibling cards and form fields, and `24px–32px` separates distinct operational sections. Responsive adaptation is structural rather than scaled:
- **`<= 1024px`:** Multi-column stat grids (`4-col`, `5-col`) reflow to balanced `2-col` / `3-col` grids, and `This Month`'s side-by-side ledger stacks cleanly.
- **`<= 860px`:** The 8-column account reconciliation matrix transforms into a labeled 2-column card grid using `.tm-mobile-label` descriptors.
- **`<= 768px`:** The fixed sidebar becomes an off-canvas `100dvh` slide-over drawer behind a `56px` safe-area mobile header; modals dock to the bottom sheet edge; data tables scroll horizontally inside contained wrappers without breaking header alignment.
- **`<= 640px`:** Interactive controls enforce a `44px` minimum touch target height, and the 31-day cash-burn strip wraps into a 7-column calendar grid.

## Elevation & Depth

Depth is communicated primarily through the four-step solid obsidian tonal ladder (`#0a0a0c` → `#121216` → `#18181f` → `#202029`) and `1px` border contrast shifts (`#22222a` → `#33333f`), reserving drop shadows strictly for floating overlays that sit above the document flow.

### Shadow Vocabulary
- **Subtle Rest Shadow** (`box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4)`): Mobile fixed top bar separation.
- **Floating Popover Shadow** (`box-shadow: 0 10px 25px rgba(0, 0, 0, 0.7)`): Table search popups, floating tooltips, and toast notifications.
- **Modal & Command Elevation** (`box-shadow: 0 20px 50px rgba(0, 0, 0, 0.85), 0 0 0 1px var(--as-border-subtle)`): Command palette (`⌘K`), modal dialogs, and slide-over drawers.

### Named Rules
**The Pure Obsidian Rule.** Surfaces never use `backdrop-filter: blur`, translucent frosted cards, or decorative glowing background orbs; hierarchy comes from solid surface steps and `1px` borders.

**The Earned Shadow Rule.** Inline cards and stat tiles sit flat on the canvas with `1px` borders; directional shadows appear only on popovers, drawers, toasts, and modals that genuinely overlap content beneath them.

## Shapes

Geometry stays crisp and utilitarian across every route:
- **Small Radius (`4px` / `--as-radius-sm`):** Buttons, form inputs, selects, icon action buttons, `.kbd` keycaps, and inline edit fields.
- **Medium Radius (`6px` / `--as-radius-md`):** Primary cards, stat tiles, data table scroll containers, and command palette rows.
- **Large Radius (`10px` / `--as-radius-lg`):** Modal dialogs, authentication cards, command palette shell, and high-density workspace strips.
- **Pill Radius (`9999px` / `--as-radius-pill`):** Telemetry status badges, category filter chips, and semantic status tags.
- **Borders:** Always `1px solid` across cards, alerts, inputs, and tables—never thick `3px–4px` colored side stripes or neobrutalist offset block shadows.

## Components

### Buttons
- **Shape:** Crisp `4px` radius (`--as-radius-sm`) with `1px` border and inline-flex `6px–8px` icon alignment.
- **Primary (`.btn-primary`):** Solid Electric Lime (`#84cc16`) fill with Deep Forest Ink (`#1a2e05`) `600`-weight label; shifts to `#65a30d` on hover.
- **Secondary (`.btn-secondary`):** Obsidian Elevated (`#18181f`) fill with `#33333f` border and `#f4f4f5` text; shifts to `#202029` on hover.
- **Danger (`.btn-danger`):** Quiet `#22222a` border and `#71717a` label at rest, revealing Rose Deficit (`#f43f5e`) border and text on hover or armed countdown.
- **States:** Explicit `:focus-visible` `2px solid #84cc16` ring with `2px` offset, `scale(0.98)` active press, and `0.55` opacity with `cursor: not-allowed` when disabled or submitting.

### Chips
- **Style:** Pill-shaped (`9999px`) compact filter controls (`4px 10px` padding, `0.72rem` `600`-weight text).
- **State:** Unselected chips sit on `--as-bg-elevated` with `--as-border-subtle`; active chips switch to `rgba(132, 204, 22, 0.12)` fill, `1px solid #84cc16` border, and `#84cc16` text with `aria-pressed="true"`.

### Cards / Containers
- **Corner Style:** `6px` radius (`--as-radius-md`) for standard cards and stat tiles; `10px` (`--as-radius-lg`) for modal and workspace shells.
- **Background & Border:** Solid `--as-bg-surface` (`#121216`) with `1px solid var(--as-border-subtle)`, stepping border to `--as-border-strong` on hover without nesting cards inside cards.
- **Internal Padding:** `20px–24px` on desktop, tightening to `16px` on tablet/mobile (`<= 768px`).

### Inputs / Fields
- **Style:** Recessed `--as-bg-base` (`#0a0a0c`) fill, `1px solid var(--as-border-subtle)`, `4px` radius, `44px` height, paired with persistent `<label htmlFor>` above the control.
- **Focus:** Border shifts to `#84cc16` with `0 0 0 1px #84cc16` crisp ring and `#84cc16` caret (`caret-color: var(--as-accent-primary)`).
- **Error & Disabled:** Validation failures bind inline helper copy via `aria-describedby` in `--as-status-error`; disabled fields dim cleanly to `0.6` opacity.

### Navigation
- **Desktop Rail:** Fixed `240px` left sidebar (`56px` collapsed) on `--as-bg-surface` with `3px` Electric Lime active indicator bar, keyboard-accessible group disclosure `<button aria-expanded>`, user identity badge, and footer session actions.
- **Mobile Drawer:** `56px` fixed header with `44x44px` menu and `⌘K` search triggers opening a `260px` `100dvh` drawer with backdrop click and `Escape` dismissal.

### Command Palette & Action Icon Docks
- **Command Palette (`.cmd-palette`):** Triggered globally via `Cmd/Ctrl+K`, featuring instant route and action filtering, `ArrowUp`/`ArrowDown`/`Enter`/`Escape` keyboard navigation, `role="dialog"`, and `aria-modal="true"`.
- **Action Icon Docks & Delete Countdown (`DeleteButton`):** Compact `36px` (`44px` on mobile) vector icon buttons wrapped in `@media (hover: hover)` `.tooltip-bubble` labels, with a two-step timed confirmation (`3s` countdown + cancel `X`) preventing accidental data loss without disruptive confirmation modals.

## Do's and Don'ts

### Do:
- **Do** use `--as-*` CSS custom properties for every surface, border, text, accent, and status color across stylesheets and TSX components.
- **Do** format all dollar amounts, APRs, percentages, and due dates in `Fira Code` (`--as-font-mono`) with `font-variant-numeric: tabular-nums` and right-align numeric table columns.
- **Do** provide explicit `loading` skeletons, actionable error banners with retry controls, and helpful empty states on every data-fetching route so slow or failed requests never flash false empty states.
- **Do** attach `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `Escape` key dismissal, and `<label htmlFor>` bindings to every modal and slide-over drawer.
- **Do** theme native browser surfaces (`color-scheme: dark`, `::selection`, `caret-color`, custom scrollbars, `:focus-visible`) to match the Pure Obsidian + Electric Lime palette.

### Don't:
- **Don't** render emojis, Unicode dingbats (`✓`, `✕`, `⚠️`), Material Symbols, or exclamation points (`!`) anywhere in UI components, tooltips, alerts, or empty states.
- **Don't** apply `backdrop-filter: blur`, `.ambient-orb` glows, gradient text, eyebrows/kickers above headings, nested cards-in-cards, or `> 1px` colored side borders.
- **Don't** load or reference legacy typefaces (`Inter`, `Space Grotesk`, `JetBrains Mono`, `IBM Plex Mono`).
- **Don't** suppress focus outlines (`outline: none`) without an immediate high-contrast `:focus-visible` replacement, or mutate hover styles via inline `onMouseOver`/`onMouseOut` handlers.
- **Don't** set mobile input font sizes below `16px` (`1rem`) or interactive mobile tap targets below `44x44px` at `<= 640px`.
