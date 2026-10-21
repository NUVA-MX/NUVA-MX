import styles from './Stat.module.css';

type Props = { value: string; label: string };

export function Stat({ value, label }: Props) {
  return (
    <div className={styles.root}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{value}</dd>
    </div>
  );
}
