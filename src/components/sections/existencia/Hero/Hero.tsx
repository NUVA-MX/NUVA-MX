import { Button } from '@/components/primitives/Button';
import { Lines } from '@/components/primitives/Lines';
import { SplitHero } from '@/components/patterns/SplitHero';
import { existencia } from '@/content/existencia';

export function Hero() {
  const h = existencia.hero;
  return (
    <SplitHero
      eyebrow={h.eyebrow}
      title={<Lines lines={h.titleLines} />}
      titleSize="split"
      body={h.body}
      facts={h.facts}
      actions={
        <Button href="#productos" variant="light" size="lg" icon="arrow" iconPosition="end">
          {h.cta}
        </Button>
      }
      media={{ src: h.image, alt: h.imageAlt }}
      height="store"
    />
  );
}
