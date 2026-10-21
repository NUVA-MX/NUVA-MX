'use client';

import { useId, type ReactNode } from 'react';
import { adminEncargo } from '@/content/admin-encargo';
import { fillTemplate } from '@/lib/format';
import { ImageUploader } from '../ImageUploader';
import styles from './EncargoImageField.module.css';

type Props = {
  /** Prefix of the form fields: `<name>.url` (hidden, set by the uploader) and `<name>.alt`. */
  name: string;
  label: string;
  url: string;
  alt: string;
  ratio: string;
  blobEnabled: boolean;
  error?: string;
  altError?: string;
  /** The "Restaurar" button for this slot (rendered by the section form). */
  restore?: ReactNode;
  overridden: boolean;
};

/** Uploader (encargo/ folder) + required alt text + the ratio hint for this slot. */
export function EncargoImageField({ name, label, url, alt, ratio, blobEnabled, error, altError, restore, overridden }: Props) {
  const altId = useId();
  const hintId = useId();
  const i = adminEncargo.image;
  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        <span className={styles.badge}>{overridden ? adminEncargo.actions.customHint : adminEncargo.actions.defaultHint}</span>
        {restore}
      </div>
      <ImageUploader name={`${name}.url`} defaultUrl={url || null} enabled={blobEnabled} prefix="encargo/" label={label} previewAlt={alt || label} />
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <p id={hintId} className={styles.hint}>
        {fillTemplate(i.ratio, { ratio })} {i.coverNote}
      </p>
      <label htmlFor={altId} className={styles.altLabel}>
        {i.altLabel}
      </label>
      <input
        id={altId}
        name={`${name}.alt`}
        type="text"
        defaultValue={alt}
        maxLength={160}
        className={styles.control}
        aria-describedby={hintId}
        aria-invalid={altError ? true : undefined}
      />
      {altError && (
        <p className={styles.error} role="alert">
          {altError}
        </p>
      )}
    </div>
  );
}
