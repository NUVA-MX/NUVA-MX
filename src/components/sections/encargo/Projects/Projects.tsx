'use client';

import { useState } from 'react';
import { Container } from '@/components/primitives/Container';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Heading } from '@/components/primitives/Heading';
import { Text } from '@/components/primitives/Text';
import { ProjectCard } from '@/components/patterns/ProjectCard';
import { Rail } from '@/components/patterns/Rail';
import { Reveal } from '@/components/patterns/Reveal';
import type { Project } from '@/content/projects';
import { ui } from '@/content/ui';
import type { EncargoContent } from '@/lib/content/encargo-merge';
import { fillTemplate } from '@/lib/format';
import { ProjectModal } from '../ProjectModal';
import styles from './Projects.module.css';

type Props = { content: EncargoContent['projects']; projects: Project[] };

export function Projects({ content: p, projects }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = projects.find((x) => x.id === openId) ?? null;
  return (
    <section id="proyectos" className={styles.root} aria-labelledby="proyectos-title">
      <Container>
        <Reveal className={styles.head}>
          <div className={styles.main}>
            <Eyebrow size="sm" tracking="label">
              {p.eyebrow}
            </Eyebrow>
            <Heading level={2} size="2xl" id="proyectos-title" className={styles.title}>
              {p.title}
            </Heading>
            <Text size="xl" leading="lead" tone="muted" measure="lead" className={styles.lead}>
              {p.lead}
            </Text>
          </div>
          <p className={styles.aside}>{p.aside}</p>
        </Reveal>
      </Container>
      <Rail ariaLabel={p.railLabel} className={styles.rail}>
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            openLabel={fillTemplate(ui.openProject, { name: project.name })}
            ctaLabel={p.cardCta}
            onOpen={setOpenId}
          />
        ))}
      </Rail>
      <ProjectModal project={open} content={p} onClose={() => setOpenId(null)} />
    </section>
  );
}
