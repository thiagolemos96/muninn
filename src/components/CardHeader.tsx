import { ENTITY_TYPES, TYPE_LABEL, type EntityType } from '../features/cards/entityTypes.ts';
import styles from './CardHeader.module.css';

type Props = {
  type: EntityType;
  name: string;
  summary: string | null;
};

// docs/design.md, component 1: type bar, name, type line, tapered rule
export function CardHeader({ type, name, summary }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.typeBar} aria-hidden="true">
        {ENTITY_TYPES.map((t) => (
          <span key={t} data-type={t} className={t === type ? styles.active : styles.segment} />
        ))}
      </div>
      <h1 className={styles.name}>{name}</h1>
      <p className={styles.kind} data-type={type}>
        <span className={styles.dot} aria-hidden="true" />
        {TYPE_LABEL[type]}
        {summary ? `, ${summary}` : null}
      </p>
      <svg
        className={styles.rule}
        viewBox="0 0 100 8"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polygon points="0,0 100,4 0,8" />
      </svg>
    </header>
  );
}
