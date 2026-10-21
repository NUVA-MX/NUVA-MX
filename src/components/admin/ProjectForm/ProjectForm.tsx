'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { saveEncargoProjectAction } from '@/app/admin/encargo-actions';
import { adminEncargo } from '@/content/admin-encargo';
import { Button } from '@/components/primitives/Button';
import { Field } from '@/components/primitives/Field';
import type { EncargoActionState } from '@/lib/content/encargo-form';
import { PROJECT_TECHNIQUES } from '@/lib/content/limits';
import { ImageUploader } from '../ImageUploader';
import styles from './ProjectForm.module.css';

export type ProjectFormData = {
  id: string;
  name: string;
  technique: string;
  tag: string;
  meta: string;
  description: string;
  techniqueDetail: string;
  minimum: string;
  colors: string;
  delivery: string;
  imageUrl: string | null;
  imageAlt: string;
  visible: boolean;
};

type Props = {
  /** Omit to create a new project. */
  project?: ProjectFormData;
  blobEnabled: boolean;
};

const initial: EncargoActionState = {};

/** Shared create/edit form. The server action validates everything again and never accepts `sortOrder`. */
export function ProjectForm({ project, blobEnabled }: Props) {
  const [state, action, pending] = useActionState(saveEncargoProjectAction, initial);
  const f = adminEncargo.projectForm;
  const e = state.errors ?? {};
  const v = state.values;
  const val = (key: keyof ProjectFormData, fallback: string | undefined) => v?.[key] ?? fallback ?? '';
  const techniques = PROJECT_TECHNIQUES.map((t) => ({ value: t, label: t }));
  return (
    <form action={action} className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>{project ? f.editTitle : f.createTitle}</h1>
        <Link href="/admin/proyectos" className={styles.back}>
          {f.back}
        </Link>
      </div>
      {project && <input type="hidden" name="id" value={project.id} />}
      {state.error && (
        <p className={styles.formError} role="alert">
          {state.error}
        </p>
      )}
      <div className={styles.grid}>
        <Field label={f.fields.name} name="name" required defaultValue={val('name', project?.name)} error={e.name} className={styles.wide} />
        <Field
          label={f.fields.technique}
          name="technique"
          as="select"
          options={techniques}
          defaultValue={val('technique', project?.technique ?? PROJECT_TECHNIQUES[0])}
          error={e.technique}
        />
        <Field label={f.fields.tag} name="tag" required defaultValue={val('tag', project?.tag)} error={e.tag} />
        <Field label={f.fields.meta} name="meta" required defaultValue={val('meta', project?.meta)} error={e.meta} className={styles.wide} />
        <Field
          label={f.fields.description}
          name="description"
          as="textarea"
          rows={5}
          required
          defaultValue={val('description', project?.description)}
          error={e.description}
          className={styles.wide}
        />
        <Field label={f.fields.techniqueDetail} name="techniqueDetail" required defaultValue={val('techniqueDetail', project?.techniqueDetail)} error={e.techniqueDetail} />
        <Field label={f.fields.minimum} name="minimum" required defaultValue={val('minimum', project?.minimum)} error={e.minimum} />
        <Field label={f.fields.colors} name="colors" required defaultValue={val('colors', project?.colors)} error={e.colors} />
        <Field label={f.fields.delivery} name="delivery" required defaultValue={val('delivery', project?.delivery)} error={e.delivery} />
        <div className={styles.wide}>
          <ImageUploader
            name="imageUrl"
            defaultUrl={v?.imageUrl ?? project?.imageUrl ?? null}
            enabled={blobEnabled}
            prefix="encargo/"
            label={f.image}
            previewAlt={val('imageAlt', project?.imageAlt) || f.image}
          />
          {e.imageUrl && <p className={styles.formError}>{e.imageUrl}</p>}
        </div>
        <Field
          label={f.fields.imageAlt}
          name="imageAlt"
          defaultValue={val('imageAlt', project?.imageAlt)}
          error={e.imageAlt}
          className={styles.wide}
        />
        <Field label={f.fields.visible} name="visible" as="checkbox" defaultChecked={v ? v.visible === 'on' : (project?.visible ?? true)} />
      </div>
      <div className={styles.footer}>
        <Button type="submit" disabled={pending}>
          {pending ? f.saving : f.save}
        </Button>
      </div>
    </form>
  );
}

