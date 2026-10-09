import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { useUiStore } from '../features/ui/uiStore.ts';
import { BookIcon, CalendarIcon, ScalesIcon, SearchIcon } from './icons.tsx';
import styles from './BottomNav.module.css';

// docs/design.md, component 9 (phone bar). Sessões and Regras stay visible but
// disabled until their phase lands.
export function BottomNav({ slug }: { slug: string }) {
  const setSearchOpen = useUiStore((state) => state.setSearchOpen);

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
      <button type="button" className={styles.tab} onClick={() => setSearchOpen(true)}>
        <SearchIcon />
        Buscar
      </button>
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
