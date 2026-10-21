import type { CSSProperties } from 'react';
import { notFound } from 'next/navigation';
import styles from './page.module.css';

export const metadata = { title: 'Tokens (dev)', robots: { index: false } };

const colors = [
  '--color-bg', '--color-bg-alt', '--color-surface', '--color-surface-inverse', '--color-placeholder',
  '--color-placeholder-inverse', '--color-text', '--color-text-muted', '--color-text-subtle', '--color-text-inverse',
  '--color-text-inverse-muted', '--color-eyebrow', '--color-eyebrow-inverse', '--color-link', '--color-action',
  '--color-action-hover', '--color-action-active', '--color-action-text', '--color-border', '--color-border-strong',
  '--color-overlay', '--color-chip-dark', '--color-status-low', '--color-badge-ok-bg', '--color-badge-low-bg',
  '--color-badge-out-bg',
];
const display = ['--display-xs', '--display-sm', '--display-md', '--display-lg', '--display-xl', '--display-2xl', '--display-hero', '--display-split'];
const text = ['--text-2xs', '--text-xs', '--text-sm', '--text-md', '--text-lg', '--text-xl'];
const spaces = ['--space-1', '--space-2', '--space-3', '--space-4', '--space-5', '--space-6', '--space-7', '--space-8', '--space-10', '--space-12', '--space-14', '--space-16', '--space-18', '--space-20', '--space-24'];
const radii = ['--radius-sm', '--radius-md', '--radius-lg', '--radius-pill'];
const themes = ['encargo', 'existencia', 'entrada'] as const;

const v = (name: string, value: string) => ({ [name]: `var(${value})` }) as CSSProperties;

export default function TokensPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <main className={styles.page}>
      <h1 className={styles.h1}>Tokens</h1>
      {themes.map((theme) => (
        <section key={theme} data-theme={theme} className={styles.theme}>
          <h2 className={styles.h2}>data-theme=&quot;{theme}&quot;</h2>
          <div className={styles.swatches}>
            {colors.map((c) => (
              <div key={c} className={styles.swatch}>
                <span className={styles.chip} style={v('--swatch', c)} />
                <code>{c}</code>
              </div>
            ))}
          </div>
        </section>
      ))}
      <section className={styles.block}>
        <h2 className={styles.h2}>Display</h2>
        {display.map((d) => (
          <p key={d} className={styles.display} style={v('--size', d)}>
            NUVA {d}
          </p>
        ))}
        <h2 className={styles.h2}>Texto</h2>
        {text.map((d) => (
          <p key={d} className={styles.text} style={v('--size', d)}>
            Gorras y prendas que llevan tu diseño — {d}
          </p>
        ))}
      </section>
      <section className={styles.block}>
        <h2 className={styles.h2}>Espacios</h2>
        {spaces.map((s) => (
          <div key={s} className={styles.spaceRow}>
            <span className={styles.bar} style={v('--w', s)} />
            <code>{s}</code>
          </div>
        ))}
        <h2 className={styles.h2}>Radios</h2>
        <div className={styles.swatches}>
          {radii.map((r) => (
            <div key={r} className={styles.swatch}>
              <span className={styles.radius} style={v('--r', r)} />
              <code>{r}</code>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
