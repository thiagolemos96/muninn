import { Link } from 'react-router';
import { LockIcon } from '../../components/icons.tsx';
import { TypeChip } from '../../components/TypeChip.tsx';
import type { EntityType } from './entityTypes.ts';
import styles from './LinksSection.module.css';

type End = { id: string; name: string; type: EntityType; visibility: 'dm' | 'party' } | null;
export type LinkRow = {
  id: string;
  label: string;
  visibility: 'dm' | 'party';
  from: End;
  to: End;
};

// Each link reads as a sentence, "Frickz ex-integrante de Banda goblin", in both
// directions: the current card is plain text, the other end is a link with its chip.
export function LinksSection({
  entityId,
  slug,
  links,
  asPlayer,
}: {
  entityId: string;
  slug: string;
  links: LinkRow[];
  asPlayer: boolean;
}) {
  const visible = links.filter(
    (link): link is LinkRow & { from: NonNullable<End>; to: NonNullable<End> } =>
      link.from !== null &&
      link.to !== null &&
      // Player preview mirrors RLS: the link and both cards must be revealed
      (!asPlayer ||
        (link.visibility === 'party' &&
          link.from.visibility === 'party' &&
          link.to.visibility === 'party')),
  );
  if (visible.length === 0) return null;

  const end = (card: NonNullable<End>) =>
    card.id === entityId ? (
      <strong className={styles.self}>{card.name}</strong>
    ) : (
      <Link to={`/c/${slug}/e/${card.id}`} className={styles.other}>
        <TypeChip type={card.type} />
        <span className={styles.otherName}>{card.name}</span>
      </Link>
    );

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Relações</h2>
      <ul className={styles.list}>
        {visible.map((link) => (
          <li key={link.id} className={link.visibility === 'dm' ? styles.secret : styles.item}>
            <span className={styles.sentence}>
              {end(link.from)} <span className={styles.label}>{link.label}</span> {end(link.to)}
            </span>
            {link.visibility === 'dm' ? (
              <span className={styles.mark}>
                <LockIcon />
                Só o mestre
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
