---
id: 0005
date: 2026-11-20
type: feat
status: accepted
branch: promo-catalog
run: 20261120-promo-catalog
checkpoint: 3c61692
supersedes:
superseded-by:
summary: Turn Promocionales into a store catalog with sidebar filters, new cards, drawer and modal
---
# 0005. Promocionales store catalog

## Request
Make /existencia a proper store catalog: shorter hero, reassurance strip, sidebar filters, new product card, "Mi lista" drawer, product modal; footer matching Merch; prices carry a "before final price" tag.

## Why (context and problem)
The catalog was a chips-and-grid page. The client wants a storefront where people browse by category, add to a list and ask for a quote by WhatsApp. The data has no prices, minimums, badges or sales ranking, so the design had to degrade without faking anything.

## Decision
- Hide what has no data: Precio and Disponibilidad filters, "Más vendidos", badge, minimum order. Reason: no reliable source; stock is a coarse, possibly stale snapshot and "sobre pedido" does not exist.
- Prices render only when present, with the tag "Antes de personalizar"; otherwise "Precio por cotización".
- "Comprar al precio publicado" only shows when an item has a price; its handler is a no-op with TODO(client): no checkout exists.
- Sidebar/sheet breakpoint is 900px (check:tokens allows only 640/900/1024/1180), pagination kept (API is paged).
- Footer on this side reuses the Merch olive band; only the band color is pinned.

## Alternatives considered
- Faking prices or a "Cargar más" button: rejected, no data and the API is paged.
- A fake checkout route: rejected by the spec.

## What changed
- New hero gradient (shorter), reassurance strip, catalog header + category sidebar + mobile Filtros sheet.
- New card, price tag, header badge with animation, restyled drawer with WhatsApp quote listing code/name/quantity.
- Modal with its own quantity selector and actions, full-height sheet on phones; footer matches Merch.
Files: src/components/sections/existencia/**, patterns/CatalogCard, patterns/CartPanel, lib/catalog/quote-message.ts, SiteFooter.module.css, tokens.css (promo block).

## Consequences
- Not viewed in a browser: layout, animation, contrast and sheet behavior are code-reviewed only.
- Prices are null today, so the price tag and buy button are not visible until prices exist.
- Branch is stacked on promo-restyle and project-photos (neither merged to main).

## Verification
DoD-1..13 PASS (tsc, eslint, vitest 692, check:copy, check-standards 0 fail). Overall PASS; visual check pending.

## Where to change this later
- Filters/sidebar: existencia/Catalog/CategoryList, FilterSheet. Card: patterns/CatalogCard. Drawer: patterns/CartPanel. Quote message: lib/catalog/quote-message.ts. Checkout: lib/catalog/checkout.ts (TODO).
