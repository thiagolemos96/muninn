import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { LockIcon, SearchIcon } from '../../components/icons.tsx';
import { TypeChip } from '../../components/TypeChip.tsx';
import type { CampaignSummary } from '../campaigns/queries.ts';
import { useViewMode } from '../campaigns/viewMode.ts';
import { useUiStore } from '../ui/uiStore.ts';
import { useSearchCorpus } from './queries.ts';
import { buildIndex, searchCards } from './searchIndex.ts';
import styles from './SearchDialog.module.css';

// Universal search (escopo M4). A native <dialog> gives focus trapping and Esc for free.
export function SearchDialog({ campaign }: { campaign: CampaignSummary }) {
  const open = useUiStore((state) => state.searchOpen);
  const setOpen = useUiStore((state) => state.setSearchOpen);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Ctrl K / ⌘K anywhere in the campaign
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(!useUiStore.getState().searchOpen);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label="Buscar cards"
      onClose={() => setOpen(false)}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog itself
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      {/* Mounted only while open: the corpus loads on first use and the input starts empty */}
      {open ? <SearchPanel campaign={campaign} onDone={() => setOpen(false)} /> : null}
    </dialog>
  );
}

function SearchPanel({ campaign, onDone }: { campaign: CampaignSummary; onDone: () => void }) {
  const navigate = useNavigate();
  const { asPlayer } = useViewMode(campaign.id);
  const corpus = useSearchCorpus(campaign.id, true);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const index = useMemo(
    () => (corpus.data ? buildIndex(corpus.data.cards, corpus.data.blocks, asPlayer) : null),
    [corpus.data, asPlayer],
  );
  const hits = useMemo(() => (index ? searchCards(index, query) : []), [index, query]);

  function openHit(id: string) {
    onDone();
    void navigate(`/c/${campaign.slug}/e/${id}`);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((current) => Math.min(current + 1, hits.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter' && hits[active]) {
      event.preventDefault();
      openHit(hits[active].id);
    } else if (event.key === 'Escape') {
      // A search input spends the first Esc clearing itself; at the table one Esc must close
      event.preventDefault();
      onDone();
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.inputRow}>
        <SearchIcon />
        <input
          autoFocus
          className={styles.input}
          type="search"
          placeholder="Buscar cards"
          aria-label="Buscar cards"
          aria-controls="search-results"
          aria-activedescendant={hits[active] ? `hit-${hits[active].id}` : undefined}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
        <kbd className={styles.kbd}>Esc</kbd>
      </div>

      {corpus.isPending ? <p className={styles.note}>Carregando…</p> : null}
      {corpus.isError ? (
        <p className={styles.note}>Não deu pra carregar a busca: {corpus.error.message}</p>
      ) : null}
      {index && query.trim() && hits.length === 0 ? (
        <p className={styles.note}>Nada encontrado pra "{query}".</p>
      ) : null}
      {index && !query.trim() ? (
        <p className={styles.note}>Nome, resumo, tag ou qualquer palavra dos blocos.</p>
      ) : null}

      <ul id="search-results" role="listbox" className={styles.results}>
        {hits.map((hit, position) => (
          <li
            key={hit.id}
            id={`hit-${hit.id}`}
            role="option"
            aria-selected={position === active}
            className={styles.hit}
            onMouseEnter={() => setActive(position)}
            onClick={() => openHit(hit.id)}
          >
            <TypeChip type={hit.type} />
            <span className={styles.hitText}>
              <span className={styles.hitName}>{hit.name}</span>
              {hit.summary ? <span className={styles.hitSummary}>{hit.summary}</span> : null}
            </span>
            {hit.secret ? (
              <span className={styles.secret} title="Só o mestre">
                <LockIcon />
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
