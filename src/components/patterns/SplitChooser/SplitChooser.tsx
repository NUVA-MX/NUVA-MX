'use client';

import { useState } from 'react';
import { SplitPanel, type SplitPanelData } from '../SplitPanel';
import styles from './SplitChooser.module.css';

type Props = { panels: readonly SplitPanelData[]; ariaLabel?: string };

/** Holds which panel is hovered/focused so the other one can shrink and dim. */
export function SplitChooser({ panels, ariaLabel }: Props) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <section className={styles.root} aria-label={ariaLabel}>
      {panels.map((panel) => (
        <SplitPanel
          key={panel.key}
          panel={panel}
          active={active === panel.key}
          dimmed={active !== null && active !== panel.key}
          onHoverChange={(hovering) => setActive((cur) => (hovering ? panel.key : cur === panel.key ? null : cur))}
        />
      ))}
    </section>
  );
}
