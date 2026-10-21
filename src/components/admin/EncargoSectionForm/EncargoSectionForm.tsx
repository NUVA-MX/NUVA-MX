'use client';

import { useActionState, useId } from 'react';
import { restoreEncargoAction, saveEncargoSectionAction } from '@/app/admin/encargo-actions';
import { adminEncargo } from '@/content/admin-encargo';
import type { EncargoActionState } from '@/lib/content/encargo-form';
import type { FieldSpec, SectionSpec, TextFieldSpec } from '@/lib/content/encargo-spec';
import { fillTemplate } from '@/lib/format';
import { EncargoImageField } from '../EncargoImageField';
import styles from './EncargoSectionForm.module.css';

type Props = { spec: SectionSpec; blobEnabled: boolean };

const initial: EncargoActionState = {};

/**
 * One form per section. "Restaurar" buttons are submit buttons of this same form with their own formAction
 * (they post `section` + `field` to restoreEncargoAction and ignore the rest), so forms are never nested.
 */
export function EncargoSectionForm({ spec, blobEnabled }: Props) {
  const [state, saveAction, saving] = useActionState(saveEncargoSectionAction, initial);
  const [restoreState, restoreAction, restoring] = useActionState(restoreEncargoAction, initial);
  const a = adminEncargo.actions;
  const busy = saving || restoring;
  const errors = state.errors ?? {};
  const values = state.values;
  const message = state.error ?? restoreState.error;

  const restoreButton = (path: string | null, label: string) => (
    <button
      type="submit"
      formAction={restoreAction}
      formNoValidate
      name={path === null ? undefined : 'field'}
      value={path === null ? undefined : path}
      className={styles.restore}
      disabled={busy}
    >
      {label}
    </button>
  );

  return (
    <form action={saveAction} className={styles.root} aria-labelledby={`section-${spec.key}`}>
      <input type="hidden" name="section" value={spec.key} />
      <div className={styles.header}>
        <h2 id={`section-${spec.key}`} className={styles.title}>
          {spec.title}
        </h2>
        {spec.overridden && restoreButton(null, a.restoreSection)}
      </div>
      {spec.notes.map((note) => (
        <p key={note} className={styles.note}>
          {note}
        </p>
      ))}
      <div className={styles.fields}>
        {spec.fields.map((f, idx) => (
          <FieldRow
            key={f.kind === 'heading' ? `h${idx}` : f.name}
            field={f}
            values={values}
            errors={errors}
            blobEnabled={blobEnabled}
            restoreButton={restoreButton}
          />
        ))}
      </div>
      {message && (
        <p className={styles.error} role="alert">
          {message}
        </p>
      )}
      {(state.ok || restoreState.ok) && !message && (
        <p className={styles.ok} role="status">
          {restoreState.ok && !state.ok ? a.restored : a.saved}
        </p>
      )}
      <div className={styles.footer}>
        <button type="submit" className={styles.save} disabled={busy}>
          {saving ? a.saving : restoring ? a.restoring : a.save}
        </button>
      </div>
    </form>
  );
}

type RowProps = {
  field: FieldSpec;
  values: Record<string, string> | undefined;
  errors: Record<string, string>;
  blobEnabled: boolean;
  restoreButton: (path: string | null, label: string) => React.ReactNode;
};

function FieldRow({ field, values, errors, blobEnabled, restoreButton }: RowProps) {
  const id = useId();
  const a = adminEncargo.actions;
  if (field.kind === 'heading') return <h3 className={styles.heading}>{field.label}</h3>;

  if (field.kind === 'image') {
    const url = values?.[`${field.name}.url`] ?? field.url;
    const alt = values?.[`${field.name}.alt`] ?? field.alt;
    return (
      <EncargoImageField
        name={field.name}
        label={field.label}
        url={url}
        alt={alt}
        ratio={field.ratio}
        blobEnabled={blobEnabled}
        error={errors[`${field.name}.url`]}
        altError={errors[`${field.name}.alt`]}
        overridden={field.overridden}
        restore={field.overridden ? restoreButton(field.restore, a.restore) : null}
      />
    );
  }

  if (field.kind === 'checkbox') {
    const checked = values ? values[field.name] === 'on' : field.checked;
    return (
      <div className={styles.checkRow}>
        <input id={id} type="checkbox" name={field.name} defaultChecked={checked} className={styles.checkbox} />
        <label htmlFor={id} className={styles.label}>
          {field.label}
        </label>
        {field.overridden && restoreButton(field.restore, a.restore)}
        {errors[field.name] && (
          <p className={styles.error} role="alert">
            {errors[field.name]}
          </p>
        )}
      </div>
    );
  }

  return <TextRow field={field} id={id} value={values?.[field.name] ?? field.value} error={errors[field.name]} restoreButton={restoreButton} />;
}

function TextRow({
  field,
  id,
  value,
  error,
  restoreButton,
}: {
  field: TextFieldSpec;
  id: string;
  value: string;
  error?: string;
  restoreButton: RowProps['restoreButton'];
}) {
  const a = adminEncargo.actions;
  const hintId = `${id}-hint`;
  const common = {
    id,
    name: field.name,
    defaultValue: value,
    maxLength: field.kind === 'date' ? undefined : field.maxLength,
    className: styles.control,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': hintId,
  };
  return (
    <div className={styles.row}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {field.label}
        </label>
        <span className={styles.badge}>{field.overridden ? a.customHint : field.defaultValue === null ? '' : a.defaultHint}</span>
        {field.overridden && restoreButton(field.restore, a.restore)}
      </div>
      {field.kind === 'textarea' ? (
        <textarea {...common} rows={4} />
      ) : (
        <input {...common} type={field.kind === 'date' ? 'date' : 'text'} />
      )}
      <p id={hintId} className={styles.hint}>
        {field.defaultValue !== null && field.overridden
          ? fillTemplate(a.defaultValue, { value: field.defaultValue })
          : a.leaveEmpty}
      </p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
