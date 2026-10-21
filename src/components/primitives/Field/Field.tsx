import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import styles from './Field.module.css';

type Base = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
};

type InputProps = Base & {
  as?: 'input';
  type?: 'text' | 'email' | 'password' | 'number' | 'url';
  defaultValue?: string | number;
  autoComplete?: string;
  inputMode?: 'numeric' | 'email' | 'text';
  min?: number;
  step?: number;
};

type TextareaProps = Base & { as: 'textarea'; defaultValue?: string; rows?: number };

type SelectProps = Base & {
  as: 'select';
  defaultValue?: string;
  options: { value: string; label: string }[];
};

type CheckboxProps = Base & { as: 'checkbox'; defaultChecked?: boolean };

export type FieldProps = InputProps | TextareaProps | SelectProps | CheckboxProps;

/** Label + control + hint/error. Ids derive from name so labels and errors stay linked. */
export function Field(props: FieldProps) {
  const { label, name, error, hint, required, className } = props;
  const id = `field-${name}`;
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  const common = {
    id,
    name,
    required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
  };
  const errorNode = error && (
    <p id={`${id}-error`} className={styles.error}>
      {error}
    </p>
  );

  if (props.as === 'checkbox') {
    return (
      <div className={cx(styles.root, styles.checkboxRow, className)}>
        <input {...common} type="checkbox" defaultChecked={props.defaultChecked} className={styles.checkbox} />
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {errorNode}
      </div>
    );
  }

  let control: ReactNode;
  if (props.as === 'textarea') {
    control = <textarea {...common} rows={props.rows ?? 3} defaultValue={props.defaultValue} className={styles.control} />;
  } else if (props.as === 'select') {
    control = (
      <select {...common} defaultValue={props.defaultValue} className={styles.control}>
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else {
    control = (
      <input
        {...common}
        type={props.type ?? 'text'}
        defaultValue={props.defaultValue}
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
        min={props.min}
        step={props.step}
        className={styles.control}
      />
    );
  }

  return (
    <div className={cx(styles.root, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {control}
      {hint && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
      {errorNode}
    </div>
  );
}
