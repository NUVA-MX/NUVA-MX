import Image from 'next/image';
import { Button } from '@/components/primitives/Button';
import { Reveal } from '@/components/patterns/Reveal';
import { encargo } from '@/content/encargo';
import { site } from '@/content/site';
import { buildMailtoLink, buildWhatsAppLink } from '@/lib/whatsapp';
import styles from './ProcesoCta.module.css';

/** Bundled pattern used while no background has been uploaded in the admin. */
const DEFAULT_BG = '/brand/cta-fondo-patron-verde.jpg';

/**
 * Closing panel on the orange gradient: the only way to order is a message (WhatsApp, plus email when set).
 * data-hide-sticky tells the phone WhatsApp button to step aside while this panel is on screen.
 */
export function ProcesoCta({ image }: { image?: string | null }) {
  const cta = encargo.proceso.cta;
  // TODO(client): the email button appears once site.email holds a real address.
  const mailto = buildMailtoLink(site.email);
  const whatsapp = buildWhatsAppLink({ phone: site.whatsapp.phone, message: cta.message });
  return (
    <div id="contactar" data-hide-sticky style={{ scrollMarginTop: 'var(--nav-offset)' }}>
      <Reveal className={styles.cta}>
        {/* next/image instead of a CSS background: the optimizer resizes it and serves AVIF/WebP. */}
        <Image
          src={image || DEFAULT_BG}
          alt=""
          fill
          sizes="(min-width: 1100px) 1100px, 100vw"
          quality={70}
          className={styles.bg}
          aria-hidden="true"
        />
        <h3 className={styles.ctaTitle}>{cta.title}</h3>
        <p className={styles.ctaBody}>{cta.body}</p>
        <div className={styles.actions}>
          <Button href={whatsapp} external size="xl" icon="whatsapp">
            {cta.whatsapp}
          </Button>
          {mailto && (
            <Button href={mailto} size="xl" variant="secondary">
              {cta.email}
            </Button>
          )}
        </div>
      </Reveal>
    </div>
  );
}
