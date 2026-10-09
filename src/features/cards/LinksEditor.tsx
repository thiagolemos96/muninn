import { useId, useState } from 'react';
import { VisibilitySelect } from '../../components/VisibilitySelect.tsx';
import { TYPE_LABEL, type EntityType } from './entityTypes.ts';
import type { LinkDraft } from './mutations.ts';
import styles from './CardEditorPage.module.css';

type CardOption = { id: string; name: string; type: EntityType };

const SUGGESTIONS = ['conhece', 'está em', 'membro de', 'aliado de', 'inimigo de', 'serve a'];

// Relations of the card being edited. New ones always start at this card:
// "{this card} {label} {other}". Saved together with the card.
export function LinksEditor({
  cardId,
  cardName,
  cards,
  links,
  onChange,
}: {
  cardId: string;
  cardName: string;
  cards: CardOption[];
  links: LinkDraft[];
  onChange: (links: LinkDraft[]) => void;
}) {
  const suggestionsId = useId();
  const [targetId, setTargetId] = useState('');
  const [label, setLabel] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const others = cards.filter((card) => card.id !== cardId);
  const nameOf = (id: string) =>
    id === cardId ? cardName || 'este card' : (cards.find((card) => card.id === id)?.name ?? '?');

  const patch = (index: number, change: Partial<LinkDraft>) =>
    onChange(links.map((link, i) => (i === index ? { ...link, ...change } : link)));

  function add() {
    if (!targetId) return setProblem('Escolha o card do outro lado.');
    if (!label.trim()) return setProblem('Escreva o rótulo, por exemplo "conhece".');
    onChange([
      ...links,
      { id: crypto.randomUUID(), fromId: cardId, toId: targetId, label, visibility: 'dm' },
    ]);
    setTargetId('');
    setLabel('');
    setProblem(null);
  }

  return (
    <>
      <h2 className={styles.subheading}>Relações</h2>
      {links.length === 0 ? <p className={styles.hint}>Nenhuma relação ainda.</p> : null}

      {links.map((link, index) => (
        <div key={link.id} className={link.visibility === 'dm' ? styles.secretBlock : styles.block}>
          <div className={styles.linkSentence}>
            <strong>{nameOf(link.fromId)}</strong>
            <input
              aria-label="Rótulo da relação"
              list={suggestionsId}
              value={link.label}
              onChange={(event) => patch(index, { label: event.target.value })}
            />
            <strong>{nameOf(link.toId)}</strong>
          </div>
          <div className={styles.blockActions}>
            <VisibilitySelect
              value={link.visibility}
              onChange={(visibility) => patch(index, { visibility })}
            />
            <span className={styles.spacer} />
            <button
              type="button"
              className={styles.button}
              onClick={() => onChange(links.filter((_, i) => i !== index))}
            >
              Remover relação
            </button>
          </div>
        </div>
      ))}

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="link-label">Rótulo</label>
          <input
            id="link-label"
            list={suggestionsId}
            value={label}
            placeholder="conhece"
            onChange={(event) => setLabel(event.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="link-target">Outro card</label>
          <select
            id="link-target"
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
          >
            <option value="">Escolha…</option>
            {others.map((card) => (
              <option key={card.id} value={card.id}>
                {card.name} ({TYPE_LABEL[card.type]})
              </option>
            ))}
          </select>
        </div>
        <button type="button" className={styles.button} onClick={add}>
          Adicionar relação
        </button>
      </div>
      {problem ? (
        <p className={styles.error} role="alert">
          {problem}
        </p>
      ) : null}

      <datalist id={suggestionsId}>
        {SUGGESTIONS.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
    </>
  );
}
