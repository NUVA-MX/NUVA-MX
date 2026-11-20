'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/primitives/Icon';
import { Media } from '@/components/primitives/Media';
import styles from './ProjectModal.module.css';

type Props = { photos: string[]; alt: string; prevLabel: string; nextLabel: string };

/** Modal photo with prev/next arrows (also the left/right keys) when there is more than one photo. Remount per project. */
export function ProjectGallery({ photos, alt, prevLabel, nextLabel }: Props) {
  const [index, setIndex] = useState(0);
  const count = photos.length;
  useEffect(() => {
    if (count < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + count) % count);
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % count);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [count]);
  const go = (step: number) => setIndex((i) => (i + step + count) % count);
  return (
    <>
      <Media src={photos[index]} alt={count > 1 ? `${alt} (${index + 1}/${count})` : alt} ratio="fill" sizes="modal" />
      {count > 1 && (
        <>
          <button type="button" className={`${styles.arrow} ${styles.prev}`} aria-label={prevLabel} onClick={() => go(-1)}>
            <Icon name="arrow" size="md" />
          </button>
          <button type="button" className={`${styles.arrow} ${styles.next}`} aria-label={nextLabel} onClick={() => go(1)}>
            <Icon name="arrow" size="md" />
          </button>
          <span className={styles.counter} aria-hidden="true">
            {index + 1} / {count}
          </span>
        </>
      )}
    </>
  );
}
