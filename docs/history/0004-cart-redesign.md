---
id: 0004
date: 2026-11-12
type: feat
status: accepted
branch: promo-restyle
run: 20261112-cart-redesign
checkpoint: ac93eaf
supersedes:
superseded-by:
summary: Redesign the Promocionales "Mi lista" drawer with logo, cards and sticky summary
---
# 0004. "Mi lista" drawer redesign

## Request
Make the "Mi lista" cart drawer on Promocionales less basic: add the logo and a better design. The user asked for the UI designer agent.

## Why (context and problem)
The drawer was a plain pale panel with a text title and a plain list, out of step with the wine and blue Promocionales look.

## Decision
- A ui-designer agent wrote the spec first; an engineer implemented it with locked tokens only (no new colors, no new copy).
- Structure: wine header (grey NUVA logo, title, item-count chip, wine-to-blue strip), soft-blue scrolling body, white item cards (letter thumbnail, name, mono SKU line, wine stepper, "Quitar"), and a sticky white footer with subtotal and the 54px wine WhatsApp button, so it stays visible with long lists.
- Empty state: greyed NUVA seal on soft rings with a filled wine "Ver productos" button.
- Behavior, copy and data are unchanged; the line price stays one "SKU · total" string.
- CartPanel.module.css (273 lines) was split into row, body and footer modules to respect the 200-line limit.

## Alternatives considered
- White header with the dark logo: rejected, the wine header ties the drawer to the hero and footer.
- Real product photos in the rows: not possible, the cart data has no images (would need a data change).

## What changed
- New drawer look with logo, item cards and sticky summary; mobile full-width sheet.
- Empty state with the seal watermark.
Files: src/components/patterns/CartPanel/* (CartPanel, CartPanelRow, CartPanelFooter, CartPanelBody and CSS modules).

## Consequences
- Notices banner, pending state and unverified note were styled but not rendered in a browser.
- `viewport-fit=cover` is not set, so the safe-area padding resolves to 0 on notched phones until it is added.

## Verification
DoD-1..6 PASS: tsc, eslint, vitest 690, check:copy, check-standards 0 fail; real Chrome screenshots of empty and with-items at 1440 and 390 (footer stays visible). Overall PASS.

## Where to change this later
- Drawer look: src/components/patterns/CartPanel/*.module.css ("cart drawer").
- Logo or header: CartPanel.tsx header block.
