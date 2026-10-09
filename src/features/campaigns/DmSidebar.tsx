import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { BookIcon, CalendarIcon, ScalesIcon, ScrollIcon } from '../../components/icons.tsx';
import { TypeFilter } from '../../components/TypeFilter.tsx';
import styles from './DmSidebar.module.css';

// docs/design.md, component 9 (desktop, DM). Only Cards exists in phase 1.
export function DmSidebar({ slug }: { slug: string }) {
  return (
    <aside className={styles.sidebar}>
      <nav aria-label="Escudo">
        <NavLink
          to={`/c/${slug}`}
          end
          className={({ isActive }) => (isActive ? styles.active : styles.item)}
        >
          <BookIcon />
          Cards
        </NavLink>
        <Soon icon={<CalendarIcon />} label="Sessões" />
        <Soon icon={<ScalesIcon />} label="Regras" />
        <Soon icon={<ScrollIcon />} label="Handouts" />
      </nav>
      <h2 className={styles.heading}>Filtrar por tipo</h2>
      <TypeFilter layout="column" />
    </aside>
  );
}

function Soon({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className={styles.soon} aria-disabled="true" title="Em breve">
      {icon}
      {label}
    </span>
  );
}
