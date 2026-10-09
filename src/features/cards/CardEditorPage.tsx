import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Status } from '../../components/Status.tsx';
import { VisibilitySelect } from '../../components/VisibilitySelect.tsx';
import { useCampaignContext } from '../campaigns/campaignContext.ts';
import { useViewMode } from '../campaigns/viewMode.ts';
import { ENTITY_TYPES, TYPE_LABEL, type EntityType } from './entityTypes.ts';
import { useDeleteCard, useSaveCard, type BlockDraft, type CardDraft } from './mutations.ts';
import { useBlocks, useEntity } from './queries.ts';
import styles from './CardEditorPage.module.css';

// "/c/:slug/novo" and "/c/:slug/e/:id/editar". The page only hides itself from
// non-DMs to keep the screen honest; the writes themselves are guarded by RLS.
export function CardEditorPage() {
  const { id } = useParams();
  const campaign = useCampaignContext();
  const { isDm, ready } = useViewMode(campaign.id);
  const entity = useEntity(campaign.id, id ?? '');
  const blocks = useBlocks(id ? entity.data?.id : undefined);

  if (!ready) return <Status>Carregando…</Status>;
  if (!isDm) return <Status>Só o mestre edita cards.</Status>;

  if (!id) {
    const blank: CardDraft = {
      id: crypto.randomUUID(),
      type: 'npc',
      name: '',
      summary: '',
      tags: [],
      visibility: 'dm',
    };
    return <CardForm key="new" isNew initialCard={blank} initialBlocks={[]} />;
  }

  if (entity.isPending || blocks.isPending) return <Status>Carregando…</Status>;
  if (entity.isError) return <Status>Não deu pra abrir o card: {entity.error.message}</Status>;
  if (blocks.isError) return <Status>Não deu pra abrir os blocos: {blocks.error.message}</Status>;
  if (!entity.data) return <Status>Esse card não existe.</Status>;

  const card = entity.data;
  return (
    <CardForm
      key={card.id}
      isNew={false}
      initialCard={{
        id: card.id,
        type: card.type,
        name: card.name,
        summary: card.summary ?? '',
        tags: card.tags,
        visibility: card.visibility,
      }}
      initialBlocks={blocks.data.map((block) => ({
        id: block.id,
        title: block.title ?? '',
        body_md: block.body_md,
        visibility: block.visibility,
      }))}
    />
  );
}

type FormProps = {
  isNew: boolean;
  initialCard: CardDraft;
  initialBlocks: BlockDraft[];
};

function CardForm({ isNew, initialCard, initialBlocks }: FormProps) {
  const campaign = useCampaignContext();
  const navigate = useNavigate();
  const save = useSaveCard();
  const remove = useDeleteCard();

  const [card, setCard] = useState(initialCard);
  const [tagsText, setTagsText] = useState(initialCard.tags.join(', '));
  const [blocks, setBlocks] = useState(initialBlocks);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [nameMissing, setNameMissing] = useState(false);

  const listPath = `/c/${campaign.slug}`;
  const cardPath = `${listPath}/e/${card.id}`;

  const patchCard = (patch: Partial<CardDraft>) => setCard((current) => ({ ...current, ...patch }));
  const patchBlock = (index: number, patch: Partial<BlockDraft>) =>
    setBlocks((current) => current.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  const moveBlock = (index: number, by: -1 | 1) =>
    setBlocks((current) => {
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(index + by, 0, moved);
      return next;
    });
  const addBlock = () =>
    setBlocks((current) => [
      ...current,
      { id: crypto.randomUUID(), title: '', body_md: '', visibility: 'dm' },
    ]);
  const removeBlock = (index: number) =>
    setBlocks((current) => current.filter((_, i) => i !== index));

  function handleSave() {
    if (!card.name.trim()) {
      setNameMissing(true);
      return;
    }
    const tags = tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    const keptIds = new Set(blocks.map((block) => block.id));
    save.mutate(
      {
        campaignId: campaign.id,
        card: { ...card, tags },
        blocks,
        removedBlockIds: initialBlocks.map((b) => b.id).filter((blockId) => !keptIds.has(blockId)),
      },
      { onSuccess: () => void navigate(cardPath) },
    );
  }

  function handleDelete() {
    remove.mutate(card.id, { onSuccess: () => void navigate(listPath) });
  }

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        handleSave();
      }}
    >
      <title>{`${isNew ? 'Novo card' : `Editar ${initialCard.name}`} · ${campaign.name}`}</title>
      <h1 className={styles.heading}>{isNew ? 'Novo card' : 'Editar card'}</h1>

      <div className={styles.field}>
        <label htmlFor="card-name">Nome</label>
        <input
          id="card-name"
          value={card.name}
          aria-invalid={nameMissing}
          aria-describedby={nameMissing ? 'card-name-error' : undefined}
          onChange={(event) => {
            setNameMissing(false);
            patchCard({ name: event.target.value });
          }}
        />
        {nameMissing ? (
          <p id="card-name-error" className={styles.error}>
            O card precisa de um nome.
          </p>
        ) : null}
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="card-type">Tipo</label>
          <select
            id="card-type"
            value={card.type}
            onChange={(event) => patchCard({ type: event.target.value as EntityType })}
          >
            {ENTITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABEL[type]}
              </option>
            ))}
          </select>
        </div>
        <VisibilitySelect
          label="Quem vê o card"
          value={card.visibility}
          onChange={(visibility) => patchCard({ visibility })}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="card-summary">Resumo</label>
        <input
          id="card-summary"
          value={card.summary}
          aria-describedby="card-summary-hint"
          onChange={(event) => patchCard({ summary: event.target.value })}
        />
        <p id="card-summary-hint" className={styles.hint}>
          Curto, aparece ao lado do tipo: "goblin artífice".
        </p>
      </div>

      <div className={styles.field}>
        <label htmlFor="card-tags">Tags</label>
        <input
          id="card-tags"
          value={tagsText}
          aria-describedby="card-tags-hint"
          onChange={(event) => setTagsText(event.target.value)}
        />
        <p id="card-tags-hint" className={styles.hint}>
          Separadas por vírgula.
        </p>
      </div>

      <h2 className={styles.subheading}>Blocos</h2>
      {blocks.length === 0 ? <p className={styles.hint}>Nenhum bloco ainda.</p> : null}

      {blocks.map((block, index) => (
        <fieldset
          key={block.id}
          className={block.visibility === 'dm' ? styles.secretBlock : styles.block}
        >
          <legend className={styles.blockLegend}>Bloco {index + 1}</legend>
          <div className={styles.field}>
            <label htmlFor={`block-title-${block.id}`}>Título</label>
            <input
              id={`block-title-${block.id}`}
              value={block.title}
              onChange={(event) => patchBlock(index, { title: event.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor={`block-body-${block.id}`}>Texto (Markdown)</label>
            <textarea
              id={`block-body-${block.id}`}
              rows={6}
              value={block.body_md}
              onChange={(event) => patchBlock(index, { body_md: event.target.value })}
            />
          </div>
          <div className={styles.blockActions}>
            <VisibilitySelect
              value={block.visibility}
              onChange={(visibility) => patchBlock(index, { visibility })}
            />
            <span className={styles.spacer} />
            <button
              type="button"
              className={styles.button}
              disabled={index === 0}
              onClick={() => moveBlock(index, -1)}
            >
              Subir
            </button>
            <button
              type="button"
              className={styles.button}
              disabled={index === blocks.length - 1}
              onClick={() => moveBlock(index, 1)}
            >
              Descer
            </button>
            <button type="button" className={styles.button} onClick={() => removeBlock(index)}>
              Remover bloco
            </button>
          </div>
        </fieldset>
      ))}

      <button type="button" className={styles.button} onClick={addBlock}>
        Adicionar bloco
      </button>

      {save.isError ? (
        <p className={styles.error} role="alert">
          Não deu pra salvar: {save.error.message}
        </p>
      ) : null}

      <div className={styles.footer}>
        <button type="submit" className={styles.primary} disabled={save.isPending}>
          {save.isPending ? 'Salvando…' : 'Salvar'}
        </button>
        <Link to={isNew ? listPath : cardPath} className={styles.button}>
          Cancelar
        </Link>
        <span className={styles.spacer} />
        {!isNew && !confirmingDelete ? (
          <button type="button" className={styles.danger} onClick={() => setConfirmingDelete(true)}>
            Apagar card
          </button>
        ) : null}
      </div>

      {confirmingDelete ? (
        <div className={styles.confirm} role="alertdialog" aria-labelledby="confirm-delete">
          <p id="confirm-delete">
            Apagar "{initialCard.name}" com todos os blocos e relações? Não dá pra desfazer.
          </p>
          {remove.isError ? (
            <p className={styles.error}>Não deu pra apagar: {remove.error.message}</p>
          ) : null}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.danger}
              disabled={remove.isPending}
              onClick={handleDelete}
            >
              Sim, apagar
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() => setConfirmingDelete(false)}
            >
              Não
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
