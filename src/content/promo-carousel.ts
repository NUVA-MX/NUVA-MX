/** Defaults of the Promocionales photo carousel: one slot per photo in public/photos/promo-NN.webp, replaceable in the admin. */
export const PROMO_CAROUSEL_SLOTS = 15;

export const promoCarousel = {
  ariaLabel: 'Fotos de productos promocionales',
  prev: 'Anterior',
  next: 'Siguiente',
  slides: Array.from({ length: PROMO_CAROUSEL_SLOTS }, (_, i) => ({
    image: `/photos/promo-${String(i + 1).padStart(2, '0')}.webp` as string | null,
    imageAlt: 'Foto de producto promocional',
  })),
};
