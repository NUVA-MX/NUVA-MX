import { ui } from '@/content/ui';
import styles from './AnnouncementBar.module.css';

/** Dark one-line bar above the nav, with an optional page-identity tag. It is not fixed: it scrolls away with the page. */
export function AnnouncementBar({ text, tag }: { text: string; tag?: string }) {
  return (
    <div role="region" aria-label={ui.announcement} className={styles.root}>
      {tag && <span className={styles.tag}>{tag}</span>}
      <p className={styles.text} title={text}>
        {text}
      </p>
    </div>
  );
}
