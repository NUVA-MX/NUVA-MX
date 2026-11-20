'use client';

import { Button } from '@/components/primitives/Button';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Icon } from '@/components/primitives/Icon';
import { InfoGrid } from '@/components/patterns/InfoGrid';
import { Modal } from '@/components/patterns/Modal';
import type { Project } from '@/content/projects';
import { site } from '@/content/site';
import { ui } from '@/content/ui';
import type { EncargoContent } from '@/lib/content/encargo-merge';
import { fillTemplate } from '@/lib/format';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { ProjectGallery } from './ProjectGallery';
import styles from './ProjectModal.module.css';

type Props = { project: Project | null; content: EncargoContent['projects']; onClose: () => void };

const TITLE_ID = 'project-modal-title';

/**
 * Project detail in the taller theme. The Modal is portaled outside the PageShell, so it gets
 * data-theme="taller" itself. Its fonts are the brand fonts, which the root layout loads. Phone: photo on top, almost full screen,
 * scrollable, with a sticky 44px close button.
 */
export function ProjectModal({ project, content: t, onClose }: Props) {
  const m = t.modal;
  const photos = project ? (project.gallery?.length ? project.gallery : project.image ? [project.image] : []) : [];
  return (
    <Modal
      open={project !== null}
      onClose={onClose}
      labelledBy={TITLE_ID}
      theme="taller"
      rootClassName={styles.backdrop}
      className={styles.box}
    >
      {project && (
        <>
          <div className={styles.closeBar}>
            <button type="button" className={styles.close} aria-label={ui.close} onClick={onClose}>
              <Icon name="close" size="md" />
            </button>
          </div>
          <div className={styles.root}>
            <div className={styles.media}>
              <ProjectGallery
                key={project.id}
                photos={photos}
                alt={project.imageAlt}
                prevLabel={m.prevPhoto}
                nextLabel={m.nextPhoto}
              />
            </div>
            <div className={styles.content}>
              <Eyebrow size="sm" tracking="label">
                {project.technique}
              </Eyebrow>
              <h2 id={TITLE_ID} className={styles.title}>
                {project.name}
              </h2>
              <p className={styles.description}>{project.description}</p>
              <InfoGrid
                className={styles.facts}
                items={[
                  { label: m.labels.technique, value: project.detail.technique },
                  { label: m.labels.minimum, value: project.detail.minimum },
                  { label: m.labels.colors, value: project.detail.colors },
                  { label: m.labels.delivery, value: project.detail.delivery },
                ]}
              />
              <div className={styles.actions}>
                <Button
                  href={buildWhatsAppLink({
                    phone: site.whatsapp.phone,
                    message: fillTemplate(t.whatsappTemplate, { name: project.name }),
                  })}
                  external
                  size="xl"
                  icon="whatsapp"
                >
                  {m.order}
                </Button>
                <Button
                  href={buildWhatsAppLink({
                    phone: site.whatsapp.phone,
                    message: fillTemplate(t.quoteTemplate, { name: project.name }),
                  })}
                  external
                  size="xl"
                  variant="secondary"
                >
                  {m.quote}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
