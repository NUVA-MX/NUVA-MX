'use client';

import { useActionState } from 'react';
import type { EncargoActionState } from '@/lib/content/encargo-form';
import { adminEncargo } from '@/content/admin-encargo';
import styles from './ActionButton.module.css';

type Props = {
  /** A server action following the (prev, formData) contract. It re-checks the admin session itself. */
  action: (prev: EncargoActionState, formData: FormData) => Promise<EncargoActionState>;
  /** Hidden inputs sent with the form (e.g. id, direction). */
  fields?: Record<string, string>;
  label: string;
  ariaLabel?: string;
  confirm?: string;
  disabled?: boolean;
  tone?: 'link' | 'danger' | 'solid';
};

const initial: EncargoActionState = {};

/** One small form per row action: pending label, optional confirm dialog, inline error. */
export function ActionButton({ action, fields = {}, label, ariaLabel, confirm, disabled, tone = 'link' }: Props) {
  const [state, formAction, pending] = useActionState(action, initial);
  return (
    <form
      action={formAction}
      className={styles.form}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" className={styles[tone]} disabled={disabled || pending} aria-label={ariaLabel}>
        {pending ? adminEncargo.projects.working : label}
      </button>
      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
