import styles from './Switch.module.css';

type Props = {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

// docs/design.md, component 10: role="switch", rubric track when on
export function Switch({ label, checked, disabled = false, onChange }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={styles.switch}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.track} aria-hidden="true">
        <span className={styles.knob} />
      </span>
      {label}
    </button>
  );
}
