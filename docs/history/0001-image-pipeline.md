---
id: 0001
date: 2026-11-12
type: perf
status: accepted
branch: image-pipeline
run: 20261112-image-pipeline
checkpoint: 61476ab
supersedes:
superseded-by:
summary: Resize and WebP uploads, blur placeholders, two new admin image slots
---
# 0001. Image pipeline and upcoming-images readiness

## Request
Prepare the site for 30+ photos that will be uploaded later through the admin, with as few hardcoded images as possible and served through the server image optimizer (no Cloudinary).

## Why (context and problem)
Admin uploads went to Vercel Blob as-is (up to 5MB each), so big camera photos would slow the first optimizer pass. Two images (the small second frame in "Sobre nosotros" and the green CTA background) were still hardcoded.

## Decision
- Resize to max 2400px and re-encode to WebP in the browser before upload; fall back to the original on any failure. The server validation stays the source of truth.
- Per-section organisation via a filename prefix (`encargo/hero-foto.webp`), not subfolders, so isSafeUploadPath, isEncargoImageUrl and blob cleanup keep their single-segment rules unchanged.
- One shared tint-matched blur placeholder for remote images; no per-image blur (would need a new library and a stored field).
- `priority` stays only on above-the-fold images (Merch hero, nav logo, entry page).
- New admin slots `taller.image2` and `proceso.ctaImage` follow the existing override pattern; unset means today's look.

## Alternatives considered
- Cloudinary or another image service: rejected, next/image on Vercel already resizes, converts and caches.
- Blob subfolders per section: rejected, would loosen security regexes.
- Per-image blur data URLs: deferred.

## What changed
- Admin uploads are smaller and named by section.
- Remote photos show a neutral placeholder while loading.
- Admin can set the second Taller frame and the CTA background image.
- Large schema/form files split to stay under the line limit.
Files: src/components/admin/ImageUploader, src/lib/image-resize.ts, src/lib/image-reencode.ts, src/lib/blur.ts, src/components/primitives/Media, src/lib/content/encargo-*.ts, src/components/sections/encargo/Taller, src/components/sections/encargo/Proceso.

## Consequences
- Browser canvas/WebP encode is not covered by automated tests (no DOM environment); try one real upload.
- `check:tokens` reports raw px/hex in several CSS files (some pre-existing, some from earlier UI work); not part of this run's gate.

## Verification
DoD-1..6 PASS (tsc, eslint, vitest 670 passed, check-standards 0 fail). DoD-7 PASS. Overall: PASS. No browser check of the new slots.

## Where to change this later
- Max size or quality: src/lib/image-reencode.ts and image-resize.ts ("upload resize").
- Blur look: src/lib/blur.ts ("image placeholder").
- New image slot: follow taller.image2 in encargo-schema, encargo-merge, encargo-form, encargo-spec ("add an admin image slot").
