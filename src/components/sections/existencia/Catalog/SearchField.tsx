'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/primitives/Icon';
import styles from './SearchField.module.css';

const DEBOUNCE_MS = 250;

type Props = {
  id: string;
  /** Search text currently in the address. */
  value: string;
  label: string;
  placeholder: string;
  clearLabel: string;
  /** Called after the debounce, with the trimmed text. */
  onCommit: (q: string) => void;
};

/** Search box with a left icon and a clear button. Typing is debounced (250 ms); the address wins on Back/forward. */
export function SearchField({ id, value, label, placeholder, clearLabel, onCommit }: Props) {
  const [text, setText] = useState(value);
  const [seen, setSeen] = useState(value);
  const commit = useRef(onCommit);

  useEffect(() => {
    commit.current = onCommit;
  });

  // The address changed from outside (Back, "Limpiar", a removed chip): follow it.
  if (value !== seen) {
    setSeen(value);
    if (text.trim() !== value) setText(value);
  }

  useEffect(() => {
    if (text.trim() === value) return;
    const timer = setTimeout(() => commit.current(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, value]);

  return (
    <div className={styles.root}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <span className={styles.icon}>
        <Icon name="search" size="md" />
      </span>
      <input
        id={id}
        type="search"
        value={text}
        maxLength={60}
        autoComplete="off"
        placeholder={placeholder}
        className={styles.input}
        onChange={(e) => setText(e.target.value)}
      />
      {text !== '' && (
        <button
          type="button"
          className={styles.clear}
          aria-label={clearLabel}
          onClick={() => {
            setText('');
            commit.current('');
          }}
        >
          <Icon name="close" size="sm" />
        </button>
      )}
    </div>
  );
}
