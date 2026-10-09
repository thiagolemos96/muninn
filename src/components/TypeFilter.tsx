import { ENTITY_TYPES, TYPE_LABEL } from '../features/cards/entityTypes.ts';
import { useUiStore } from '../features/ui/uiStore.ts';
import styles from './TypeFilter.module.css';

// "Filtrar por tipo": one toggle per card type, with its color dot. Click again to clear.
export function TypeFilter({ layout }: { layout: 'row' | 'column' }) {
  const typeFilter = useUiStore((state) => state.typeFilter);
  const setTypeFilter = useUiStore((state) => state.setTypeFilter);

  return (
    <div
      className={layout === 'row' ? styles.row : styles.column}
      role="group"
      aria-label="Filtrar por tipo"
    >
      {ENTITY_TYPES.map((type) => {
        const active = typeFilter === type;
        return (
          <button
            key={type}
            type="button"
            data-type={type}
            aria-pressed={active}
            className={styles.option}
            onClick={() => setTypeFilter(active ? null : type)}
          >
            <span className={styles.dot} aria-hidden="true" />
            {TYPE_LABEL[type]}
          </button>
        );
      })}
    </div>
  );
}
