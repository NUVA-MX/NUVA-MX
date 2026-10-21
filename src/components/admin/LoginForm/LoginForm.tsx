'use client';

import { useActionState } from 'react';
import { loginAction, type LoginState } from '@/app/admin/actions';
import { admin } from '@/content/admin';
import { Button } from '@/components/primitives/Button';
import { Field } from '@/components/primitives/Field';
import styles from './LoginForm.module.css';

const initial: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);
  return (
    <form action={action} className={styles.root}>
      <h1 className={styles.title}>{admin.login.title}</h1>
      <Field label={admin.login.email} name="email" type="email" autoComplete="username" inputMode="email" required />
      <Field label={admin.login.password} name="password" type="password" autoComplete="current-password" required />
      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} block>
        {pending ? admin.login.pending : admin.login.submit}
      </Button>
      <p className={styles.help}>{admin.login.resetHelp}</p>
    </form>
  );
}
