---
id: 0002
date: 2026-11-12
type: feat
status: accepted
branch: promo-restyle
run: 20261112-promo-restyle
checkpoint: ac93eaf
supersedes:
superseded-by:
summary: Restyle Promocionales with a wine-to-blue gradient system and promo tokens
---
# 0002. Promocionales gradient + blue restyle

## Request
Restyle /existencia only: new promo color tokens, hero gradient with light grain, blue catalog section with white cards and wine actions, two-column info section, wine footer, "Mi lista" moved in the header. Merch must not change.

## Why (context and problem)
The Promocionales side mixed old cream/yellow/olive colors with several one-off blues added during iteration. The client wanted one coherent system tied to the hero gradient.

## Decision
- One token set (`--promo-wine`, `--promo-wine-dark`, `--promo-blue`, `--promo-blue-soft`, `--promo-ink`, `--promo-ink-muted`) in tokens.css; the hero gradient ends on `--promo-blue` and the catalog section uses the same token, so there is no seam. This supersedes the temporary #a4bbcb tweaks.
- Merch stays identical: every Promocionales rule is scoped with `:global([data-side='existencia'])` or the existencia side block; the Promocionales hero rules live in HeroPromo.module.css.
- `--brand` on existencia is `--promo-wine`, so footer, switch pill and the mode transition follow it.
- The page body is not made blue globally; sections own their backgrounds, and `.main` is white on existencia so no grey gap shows before the footer.
- `--soft-*` names kept as aliases of `--promo-*` (and renamed where misleading) so catalog, cart and card code needed no restructuring.

## Alternatives considered
- Renaming every `--soft-*` use to `--promo-*`: more churn for no visible benefit.
- A global blue body background: rejected earlier by the client.

## What changed
- Hero: spec gradient, 7% grain overlay (Promocionales only), content in the top of the hero, 52px buttons.
- Header: Mi lista on the right before WhatsApp on desktop (mobile unchanged, top-left); wine active pill.
- Catalog, cards, chips, search/sort restyled; cart drawer and list button follow the palette.
- Info section in two columns with a blue card; footer wine with white text.
Files: src/styles/tokens.css, Hero/HeroPromo.module.css, TallerNav, SiteFooter, PageShell, CatalogCard, Catalog/*, Envios, ListFab, CartPanel.

## Consequences
- Not viewed in a browser at 360/390/768/1280/1440; the 2-column phone grid and info stacking are code-reviewed only.
- Subtitle contrast on the mid-gradient stop is estimated, not measured.
- `check:tokens` still reports older raw px/hex items elsewhere (Merch/entry files).

## Verification
DoD-1..8 PASS by command checks (tsc, eslint, vitest 670, check-standards 0 fail, old-hex grep empty, /encargo and /existencia 200). Overall PASS; visual check pending.

## Where to change this later
- Colors: the `--promo-*` block in tokens.css ("promo palette").
- Hero look: Hero/HeroPromo.module.css ("Promocionales hero").
- Card look: patterns/CatalogCard ("product card").
