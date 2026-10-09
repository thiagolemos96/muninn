import { SearchIcon } from '../../components/icons.tsx';
import { useUiStore } from '../ui/uiStore.ts';
import styles from './SearchButton.module.css';

// "wide": the DM top bar field ("Buscar cards e regras", hint Ctrl K, docs/design.md
// component 10). "icon": the magnifier in the player top bar.
export function SearchButton({ variant }: { variant: 'wide' | 'icon' }) {
  const setOpen = useUiStore((state) => state.setSearchOpen);

  if (variant === 'icon') {
    return (
      <button
        type="button"
        className={styles.icon}
        aria-label="Buscar"
        title="Buscar (Ctrl K)"
        onClick={() => setOpen(true)}
      >
        <SearchIcon />
      </button>
    );
  }

  return (
    <button type="button" className={styles.wide} onClick={() => setOpen(true)}>
      <SearchIcon />
      {/* The design says "Buscar cards e regras"; rules arrive in phase 3 */}
      <span className={styles.placeholder}>Buscar cards</span>
      <kbd className={styles.kbd}>Ctrl K</kbd>
    </button>
  );
}
