import { Hero as PhotoHero } from '@/components/sections/encargo/Hero';
import { existencia } from '@/content/existencia';
import { encargo } from '@/content/encargo';
import { site } from '@/content/site';
import { buildWhatsAppLink } from '@/lib/whatsapp';

/** Same full-bleed photo hero as /encargo; only the copy and links differ. */
export function Hero() {
  const h = existencia.hero;
  return (
    <PhotoHero
      primaryIcon="arrow"
      content={{
        ...h,
        secondary: {
          label: h.secondary.label,
          href: buildWhatsAppLink({ phone: site.whatsapp.phone, message: encargo.whatsapp.messages.general }),
        },
        label: '',
      }}
    />
  );
}
