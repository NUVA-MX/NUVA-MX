import Link from 'next/link';
import { cx } from '@/lib/cx';
import styles from './SegmentedSwitch.module.css';

export type SwitchOption = { key: string; label: string; href: string };

type Props = {
  options: readonly SwitchOption[];
  current: string;
  ariaLabel: string;
  className?: string;
};

/** Pill switch between the two sides of the business. The current option has aria-current="page". */
export function SegmentedSwitch({ options, current, ariaLabel, className }: Props) {
  return (
    <nav aria-label={ariaLabel} className={cx(styles.root, className)}>
      {options.map((opt) => {
        const isCurrent = opt.key === current;
        return (
          <Link
            key={opt.key}
            href={opt.href}
            aria-current={isCurrent ? 'page' : undefined}
            className={cx(styles.option, isCurrent && styles.current)}
          >
            {opt.label}
          </Link>
        );
      })}
    </nav>
  );
}
