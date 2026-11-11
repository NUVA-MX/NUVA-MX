import Image from 'next/image';
import Link from 'next/link';
import styles from './SiteFooter.module.css';

type Props = {
  brand: string;
  /** Logo image shown instead of the brand text (the text stays as the alt/accessible name). */
  logo?: { src: string; width: number; height: number };
  brandHref: string;
  brandLabel: string;
  tagline: string;
  copyright: string;
  links?: readonly { label: string; href: string }[];
};

export function SiteFooter({ brand, logo, brandHref, brandLabel, tagline, copyright, links = [] }: Props) {
  return (
    <footer className={styles.root}>
      <div className={styles.inner}>
        <Link href={brandHref} className={styles.brand} aria-label={brandLabel}>
          {logo ? (
            <Image src={logo.src} width={logo.width} height={logo.height} alt="" className={styles.logo} />
          ) : (
            brand
          )}
        </Link>
        <span className={styles.text}>{tagline}</span>
        {links.length > 0 && (
          <ul className={styles.links}>
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className={styles.link} target="_blank" rel="noopener noreferrer">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        )}
        <span className={styles.copy}>{copyright}</span>
      </div>
    </footer>
  );
}
