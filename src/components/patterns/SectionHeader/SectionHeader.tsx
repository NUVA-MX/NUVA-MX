import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Heading, type HeadingSize } from '@/components/primitives/Heading';
import { Text } from '@/components/primitives/Text';
import styles from './SectionHeader.module.css';

type Props = {
  eyebrow?: ReactNode;
  title: ReactNode;
  titleId?: string;
  titleSize?: Extract<HeadingSize, 'xl' | '2xl'>;
  level?: 1 | 2 | 3;
  lead?: ReactNode;
  align?: 'start' | 'center';
  tone?: 'default' | 'inverse';
  aside?: ReactNode;
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  titleId,
  titleSize = 'xl',
  level = 2,
  lead,
  align = 'start',
  tone = 'default',
  aside,
  className,
}: Props) {
  const inverse = tone === 'inverse';
  return (
    <header className={cx(styles.root, styles[align], className)}>
      <div className={styles.main}>
        {eyebrow && <Eyebrow tone={inverse ? 'inverse' : 'default'}>{eyebrow}</Eyebrow>}
        <Heading level={level} size={titleSize} tone={tone} id={titleId} className={styles.title}>
          {title}
        </Heading>
        {lead && (
          <Text
            size={align === 'center' ? 'xl' : 'lg'}
            leading={align === 'center' ? 'lead' : 'body'}
            tone={inverse ? 'inverse-muted' : 'muted'}
            measure={align === 'center' ? 'none' : 'lead'}
            className={styles.lead}
          >
            {lead}
          </Text>
        )}
      </div>
      {aside && <div className={styles.aside}>{aside}</div>}
    </header>
  );
}
