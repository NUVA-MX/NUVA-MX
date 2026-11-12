/** Defaults of the Promocionales photo carousel: 8 fixed slots, empty until filled in the admin. */
export const PROMO_CAROUSEL_SLOTS = 8;

export const promoCarousel = {
  ariaLabel: 'Fotos de productos promocionales',
  prev: 'Anterior',
  next: 'Siguiente',
  slides: Array.from({ length: PROMO_CAROUSEL_SLOTS }, () => ({
    image: null as string | null,
    imageAlt: 'Foto de producto promocional',
  })),
};
