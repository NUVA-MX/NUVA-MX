'use client';

import { upload } from '@vercel/blob/client';
import { useId, useState, type ChangeEvent } from 'react';
import { admin } from '@/content/admin';
import { UPLOAD_PREFIX, type UploadPrefix } from '@/lib/blob';
import { Media } from '@/components/primitives/Media';
import styles from './ImageUploader.module.css';

type Props = {
  /** Hidden input name that carries the uploaded URL to the server action. */
  name: string;
  defaultUrl: string | null;
  enabled: boolean;
  /** Blob folder for new uploads. Defaults to product photos. */
  prefix?: UploadPrefix;
  /** Overrides the field label (defaults to the generic photo label). */
  label?: string;
  /** Alt text for the preview thumbnail. */
  previewAlt?: string;
};

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';

function safeName(file: File, prefix: UploadPrefix): string {
  const base = file.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/\.{2,}/g, '.')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 80);
  // Must match isSafeUploadPath() on the server.
  return `${prefix}${base || 'foto'}`;
}

export function ImageUploader({ name, defaultUrl, enabled, prefix = UPLOAD_PREFIX, label, previewAlt }: Props) {
  const inputId = useId();
  const statusId = useId();
  const [url, setUrl] = useState(defaultUrl ?? '');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle');

  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ACCEPT.split(',').includes(file.type) || file.size > MAX_BYTES) {
      setStatus('error');
      return;
    }
    setStatus('uploading');
    try {
      const blob = await upload(safeName(file, prefix), file, { access: 'public', handleUploadUrl: '/api/admin/upload' });
      setUrl(blob.url);
      setStatus('idle');
    } catch (err) {
      console.error('[ImageUploader]', err);
      setStatus('error');
    }
  }

  return (
    <div className={styles.root}>
      <span className={styles.label}>{label ?? admin.upload.label}</span>
      <input type="hidden" name={name} value={url} />
      {url && (
        <div className={styles.preview}>
          <Media src={url} alt={previewAlt ?? admin.upload.previewAlt} ratio="1/1" sizes="thumb" />
        </div>
      )}
      {enabled ? (
        <div className={styles.controls}>
          <label htmlFor={inputId} className={styles.choose}>
            {status === 'uploading' ? admin.upload.uploading : admin.upload.choose}
          </label>
          <input
            id={inputId}
            type="file"
            accept={ACCEPT}
            onChange={onChange}
            disabled={status === 'uploading'}
            className={styles.file}
            aria-describedby={statusId}
          />
          {url && (
            <button type="button" className={styles.remove} onClick={() => setUrl('')}>
              {admin.upload.remove}
            </button>
          )}
        </div>
      ) : (
        <p className={styles.note}>{admin.upload.notConfigured}</p>
      )}
      <p id={statusId} className={styles.error} role="status">
        {status === 'error' ? admin.upload.error : ''}
      </p>
    </div>
  );
}
