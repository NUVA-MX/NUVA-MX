import Link from 'next/link';
import { cx } from '@/lib/cx';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Heading } from '@/components/primitives/Heading';
import { Icon } from '@/components/primitives/Icon';
import { Lines } from '@/components/primitives/Lines';
import { Media } from '@/components/primitives/Media';
import styles from './SplitPanel.module.css';

export type SplitPanelData = {
  key: string;
  href: string;
  theme: string;
  /** Color of the panel inside its theme: olive (default) or wine. */
  tone?: 'olive' | 'wine';
  eyebrow: string;
  titleLines: readonly string[];
  body: string;
  /** One short line that says what you get on this side. */
  preview?: string;
  /** Text of the button-style affordance; the whole panel is the link. */
  cue: string;
  image: string | null;
  imageAlt: string;
};

type Props = {
  panel: SplitPanelData;
  active?: boolean;
  dimmed?: boolean;
  onHoverChange?: (hovering: boolean) => void;
};

/** One half of the Entrada. The whole panel is a link; its theme comes from data-theme, its color from tone. */
export function SplitPanel({ panel, active = false, dimmed = false, onHoverChange }: Props) {
  return (
    <Link
      href={panel.href}
      data-theme={panel.theme}
      className={cx(styles.root, panel.tone === 'wine' && styles.wine, active && styles.active, dimmed && styles.dimmed)}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      onFocus={() => onHoverChange?.(true)}
      onBlur={() => onHoverChange?.(false)}
    >
      <div className={styles.photo}>
        <Media src={panel.image} alt={panel.imageAlt} ratio="fill" tone="inverse" sizes="half" priority />
      </div>
      <div className={styles.veil} aria-hidden="true" />
      <div className={styles.content}>
        <Eyebrow tone="inverse" tracking="label">
          {panel.eyebrow}
        </Eyebrow>
        <Heading level={2} size="split" tone="inverse">
          <Lines lines={panel.titleLines} />
        </Heading>
        <p className={styles.body}>{panel.body}</p>
        {panel.preview && <p className={styles.preview}>{panel.preview}</p>}
        <span className={styles.button}>
          {panel.cue}
          <Icon name="arrow" size="sm" />
        </span>
      </div>
    </Link>
  );
}
