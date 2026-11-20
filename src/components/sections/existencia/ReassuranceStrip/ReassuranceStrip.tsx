import { Icon } from '@/components/primitives/Icon';
import { Container } from '@/components/primitives/Container';
import { existencia } from '@/content/existencia';
import { encargo } from '@/content/encargo';
import { site } from '@/content/site';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import styles from './ReassuranceStrip.module.css';

/** Four reassurance tiles between the hero and the catalog; the last one opens WhatsApp. */
export function ReassuranceStrip() {
  const r = existencia.reassurance;
  const whatsapp = buildWhatsAppLink({ phone: site.whatsapp.phone, message: encargo.whatsapp.messages.general });
  return (
    <section className={styles.root} aria-label={r.label}>
      <Container>
        <ul className={styles.list}>
          {r.items.map((item) => {
            const inner = (
              <>
                <span className={styles.icon}>
                  <Icon name={item.icon} size="md" />
                </span>
                <span className={styles.text}>
                  <span className={styles.title}>{item.title}</span>
                  <span className={styles.body}>{item.body}</span>
                </span>
              </>
            );
            return (
              <li key={item.title}>
                {item.icon === 'whatsapp' ? (
                  <a href={whatsapp} className={`${styles.tile} ${styles.link}`} target="_blank" rel="noopener noreferrer">
                    {inner}
                  </a>
                ) : (
                  <div className={styles.tile}>{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
