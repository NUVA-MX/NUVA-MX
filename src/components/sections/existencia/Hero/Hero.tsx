import { Hero as PhotoHero } from '@/components/sections/encargo/Hero';
import { existencia } from '@/content/existencia';

/** Same full-bleed photo hero as /encargo; only the copy differs, and it has just the "Ver productos" button. */
export function Hero() {
  const h = existencia.hero;
  return (
    <PhotoHero
      primaryIcon="arrow"
      content={{
        ...h,
        label: '',
      }}
    />
  );
}
