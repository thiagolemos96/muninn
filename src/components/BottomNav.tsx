import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { BookIcon, CalendarIcon, ScalesIcon, SearchIcon } from './icons.tsx';
import styles from './BottomNav.module.css';

// docs/design.md, component 9 (phone bar). Only the Grimório exists in phase 0;
// the other tabs stay visible but disabled until their phase lands.
export function BottomNav({ slug }: { slug: string }) {
  return (
    <nav className={styles.nav} aria-label="Navegação do Grimório">
      <NavLink
        to={`/c/${slug}`}
        className={({ isActive }) => (isActive ? styles.active : styles.tab)}
      >
        <BookIcon />
        Grimório
      </NavLink>
      <SoonTab icon={<CalendarIcon />} label="Sessões" />
      <SoonTab icon={<ScalesIcon />} label="Regras" />
      <SoonTab icon={<SearchIcon />} label="Buscar" />
    </nav>
  );
}

function SoonTab({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className={styles.soon} aria-disabled="true" title="Em breve">
      {icon}
      {label}
    </span>
  );
}
