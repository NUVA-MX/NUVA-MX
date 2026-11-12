---
id: 0003
date: 2026-11-12
type: feat
status: accepted
branch: promo-restyle
run: 20261112-promo-carousel
checkpoint: ac93eaf
supersedes:
superseded-by:
summary: Add an admin-fillable photo carousel at the bottom of Promocionales
---
# 0003. Promocionales photo carousel

## Request
A photo carousel on /existencia, empty for now, to be filled later by the client. After a first placement under the hero, the user clarified it belongs at the bottom of the page, right before the white info section, on top of it.

## Why (context and problem)
The client wants photos on Promocionales but has none yet; the layout and the admin slots must exist so they can fill it without a code change.

## Decision
- Placement: after the catalog, before the white info section; the cards hang over the top of the white section (`--promo-carousel-overlap`, 200px desktop / 150px phone) while the blue catalog area continues behind their upper part. Products/catalog and carousel share `--promo-blue`.
- Reuse the existing Rail scroller (scroll-snap, arrow keys, drag) and add 44px prev/next buttons; no autoplay; reduced motion respected (Rail got a small reduced-motion helper, the only shared change).
- Admin: new override section `promoCarousel` with 8 slots (image + alt) following the taller.image2 / equipos.slides pattern; URLs still validated by isEncargoImageUrl; uploads named `promocarousel-...`.
- /existencia now reads the resolved content through getEncargoPage() and is ISR (300s); admin saves revalidate /existencia as well.

## Alternatives considered
- Placing the carousel under the hero (first attempt): rejected by the user.
- A new scroller component: rejected, Rail fits.
- Hardcoded image list in code: rejected, the client fills it via the admin.

## What changed
- New carousel section with 8 empty placeholder cards and prev/next buttons.
- New admin section "promoCarousel" with 8 photo + alt slots.
- /existencia reads slots from the server and revalidates on admin save.
Files: src/components/sections/existencia/PromoCarousel, src/content/promo-carousel.ts, src/lib/content/encargo-promo-carousel.ts (+ schema/merge/form/spec wiring), src/app/(site)/existencia/page.tsx, src/app/admin/encargo-refresh.ts.

## Consequences
- /existencia now depends on the same content loader as /encargo (falls back to defaults on failure).
- Files near the line limit were split (schema-text, diff, spec-marquee).
- A real upload of a carousel photo has not been tried in a browser.

## Verification
DoD-1..6 PASS: tsc, eslint, vitest 690, check:copy, check-standards 0 fail; real Chrome screenshots at 1440 and 390/360 (no horizontal overflow). Overall PASS; admin upload flow not exercised live.

## Where to change this later
- Card size, overlap, look: PromoCarousel.module.css and `--promo-carousel-*` tokens ("promo carousel").
- Number of slots or defaults: src/content/promo-carousel.ts and encargo-promo-carousel.ts ("carousel slots").
