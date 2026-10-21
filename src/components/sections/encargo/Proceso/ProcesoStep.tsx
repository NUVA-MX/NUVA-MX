import Image from 'next/image';
import { Media } from '@/components/primitives/Media';
import { Reveal } from '@/components/patterns/Reveal';
import type { ProcesoIcon, ProcesoStep as StepData } from '@/content/encargo-proceso';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import styles from './ProcesoStep.module.css';

/** Brand-kit graphics (public/brand, resized for the web). The kit has no tool icons, only these. Decorative. */
const ICONS: Record<ProcesoIcon, string> = {
  notebook: '/brand/step-notebook.png',
  cap: '/brand/step-cap.png',
  line: '/brand/line-orange.png',
  tee: '/brand/step-tee.png',
  hoodie: '/brand/step-hoodie.png',
  mug: '/brand/step-mug.png',
};

const ICON_SIZE = 240;

type Props = {
  step: StepData;
  index: number;
  isLast: boolean;
  stepLabel: string;
  phone: string;
};

/** One step: badge and trail on the rail, a photo (or a tinted block with the icon), then title, text and links. */
export function ProcesoStep({ step, index, isLast, stepLabel, phone }: Props) {
  return (
    <li className={styles.step}>
      {/* Level-map trail (like a game map): a round badge per step, a dashed wave to the next one. */}
      <div className={styles.rail}>
        {!isLast && (
          <svg className={styles.trail} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path className={styles.wave} d="M50 0 C 100 25, 0 75, 50 100" vectorEffect="non-scaling-stroke" />
            <path className={styles.zigzag} d="M0 0 C 0 50, 100 50, 100 100" vectorEffect="non-scaling-stroke" />
          </svg>
        )}
        <Reveal className={styles.badge}>
          <span className={styles.numberLabel}>{stepLabel} </span>
          {String(index + 1).padStart(2, '0')}
        </Reveal>
      </div>
      <Reveal className={styles.photo}>
        <Media src={step.image} alt={step.imageAlt} ratio="4/3" radius="card" tint={index % 2 ? 'wine' : 'olive'}>
          <Image src={ICONS[step.icon]} alt="" width={ICON_SIZE} height={ICON_SIZE} className={styles.icon} />
        </Media>
      </Reveal>
      <Reveal className={styles.copy}>
        <h3 className={styles.stepTitle}>{step.title}</h3>
        <p className={styles.body}>{step.body}</p>
        {step.link && (
          <a
            className={styles.link}
            href={buildWhatsAppLink({ phone, message: step.link.message })}
            target="_blank"
            rel="noopener noreferrer"
          >
            {step.link.label}
          </a>
        )}
      </Reveal>
    </li>
  );
}
