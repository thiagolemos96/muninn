import { useId } from 'react';
import type { Enums } from '../lib/database.types.ts';
import { EyeIcon, LockIcon } from './icons.tsx';
import styles from './VisibilitySelect.module.css';

type Visibility = Enums<'visibility'>;

// Phase 1 stand-in for "Revelar": a plain choice, no session is recorded.
export function VisibilitySelect({
  value,
  onChange,
  label = 'Quem vê',
}: {
  value: Visibility;
  onChange: (value: Visibility) => void;
  label?: string;
}) {
  const name = useId();

  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{label}</legend>
      <label className={styles.option} data-value="dm">
        <input type="radio" name={name} checked={value === 'dm'} onChange={() => onChange('dm')} />
        <LockIcon />
        Só o mestre
      </label>
      <label className={styles.option} data-value="party">
        <input
          type="radio"
          name={name}
          checked={value === 'party'}
          onChange={() => onChange('party')}
        />
        <EyeIcon />
        Grupo
      </label>
    </fieldset>
  );
}
