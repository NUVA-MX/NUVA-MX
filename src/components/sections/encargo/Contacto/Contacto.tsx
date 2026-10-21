import { Button } from '@/components/primitives/Button';
import { Container } from '@/components/primitives/Container';
import { Reveal } from '@/components/patterns/Reveal';
import { encargo } from '@/content/encargo';
import { site } from '@/content/site';
import { buildMailtoLink, buildWhatsAppLink } from '@/lib/whatsapp';
import styles from './Contacto.module.css';

/** Centered light block with WhatsApp and email. */
export function Contacto() {
  const c = encargo.contacto;
  // TODO(client): the email button appears once site.email holds a real address.
  const mailto = buildMailtoLink(site.email);
  return (
    <section id="contacto" className={styles.root} aria-labelledby="contacto-title" data-hide-sticky>
      <Container>
        <Reveal className={styles.block}>
          <h2 id="contacto-title" className={styles.title}>
            {c.title}
          </h2>
          <p className={styles.body}>{c.body}</p>
          <div className={styles.actions}>
            <Button
              href={buildWhatsAppLink({ phone: site.whatsapp.phone, message: encargo.whatsapp.messages.general })}
              external
              size="xl"
              icon="whatsapp"
            >
              {c.whatsapp}
            </Button>
            {mailto && (
              <Button href={mailto} size="xl" variant="secondary">
                {c.email}
              </Button>
            )}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
