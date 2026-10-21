import { Card } from '../Card';
import { Icon } from '@/components/primitives/Icon';
import { Media } from '@/components/primitives/Media';
import styles from './ProjectCard.module.css';

export type ProjectCardData = {
  id: string;
  name: string;
  technique: string;
  meta: string;
  image: string | null;
  imageAlt: string;
};

type Props = {
  project: ProjectCardData;
  /** Accessible name of the open button, e.g. "Ver detalle del proyecto: Cafe de barrio". */
  openLabel: string;
  /** Visible text on the photo, e.g. "Ver proyecto". Decorative: the button already has openLabel. */
  ctaLabel: string;
  onOpen: (id: string) => void;
};

/**
 * Rail card: 4:5 photo with a technique chip, then name and meta. A real <button> is laid over
 * the whole card, so the card is clickable while the heading stays outside the button.
 * Nothing depends on hover: the chip and the text label are always visible.
 */
export function ProjectCard({ project, openLabel, ctaLabel, onOpen }: Props) {
  return (
    <Card as="article" interactive className={styles.root}>
      <div className={styles.media}>
        <Media src={project.image} alt={project.imageAlt} ratio="4/5" radius="card" tint="wine" sizes="projectTaller" />
        <span className={styles.technique}>{project.technique}</span>
        <span className={styles.cta} aria-hidden="true">
          {ctaLabel}
          <Icon name="arrow" size="sm" />
        </span>
      </div>
      <div className={styles.text}>
        <h3 className={styles.name}>{project.name}</h3>
        <p className={styles.meta}>{project.meta}</p>
      </div>
      <button
        type="button"
        className={styles.open}
        aria-label={openLabel}
        aria-haspopup="dialog"
        onClick={() => onOpen(project.id)}
      />
    </Card>
  );
}
