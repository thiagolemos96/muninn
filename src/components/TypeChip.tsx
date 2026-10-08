import { TYPE_LABEL, type EntityType } from '../features/cards/entityTypes.ts';
import styles from './TypeChip.module.css';

// docs/design.md, component 7: color always comes with the text label
export function TypeChip({ type }: { type: EntityType }) {
  return (
    <span className={styles.chip} data-type={type}>
      <span className={styles.dot} aria-hidden="true" />
      {TYPE_LABEL[type]}
    </span>
  );
}
