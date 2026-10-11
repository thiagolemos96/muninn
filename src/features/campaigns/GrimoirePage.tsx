import { Link } from 'react-router';
import { EyeIcon, LockIcon } from '../../components/icons.tsx';
import { Status } from '../../components/Status.tsx';
import { TypeChip } from '../../components/TypeChip.tsx';
import { TypeFilter } from '../../components/TypeFilter.tsx';
import { useEntities } from '../cards/queries.ts';
import { useUiStore } from '../ui/uiStore.ts';
import { useCampaignContext } from './campaignContext.ts';
import { ExportButton } from './ExportButton.tsx';
import { useViewMode } from './viewMode.ts';
import styles from './GrimoirePage.module.css';

// "/c/:slug": every card this viewer may see. Anonymous visitors get only the
// revealed ones; the DM also gets the hidden ones, marked.
export function GrimoirePage() {
  const campaign = useCampaignContext();
  const entities = useEntities(campaign.id);
  const { isDm, asPlayer } = useViewMode(campaign.id);
  const typeFilter = useUiStore((state) => state.typeFilter);

  // Preview of what a player gets: a closed Grimório shows nothing at all
  if (asPlayer && !campaign.is_public) {
    return (
      <>
        <PreviewNote />
        <Status>Esse Grimório está fechado ou o link está errado.</Status>
      </>
    );
  }

  const visible = (entities.data ?? []).filter(
    (entity) =>
      (!asPlayer || entity.visibility === 'party') && (!typeFilter || entity.type === typeFilter),
  );

  return (
    <>
      <title>{`${campaign.name} · Muninn`}</title>
      {asPlayer ? <PreviewNote /> : null}
      <div className={styles.titleRow}>
        <h1 className={styles.heading}>{isDm && !asPlayer ? 'Cards' : 'Grimório'}</h1>
        {isDm && !asPlayer ? (
          <span className={styles.titleActions}>
            <Link to="importar" className={styles.importLink}>
              Importar
            </Link>
            <ExportButton campaign={campaign} />
            <Link to="novo" className={styles.newCard}>
              Novo card
            </Link>
          </span>
        ) : null}
      </div>

      {/* Only the DM can load a closed campaign, so this note is for them */}
      {!campaign.is_public && !asPlayer ? (
        <p className={styles.closed}>
          <LockIcon />
          Grimório fechado: por enquanto, só você vê esta página.
        </p>
      ) : null}

      {/* The DM sidebar has its own filter on wide screens */}
      <div className={isDm ? styles.filterPhoneOnly : undefined}>
        <TypeFilter layout="row" />
      </div>

      {entities.isPending ? <Status>Carregando…</Status> : null}
      {entities.isError ? (
        <Status>Não deu pra carregar os cards: {entities.error.message}</Status>
      ) : null}
      {entities.isSuccess && visible.length === 0 ? (
        <Status>{typeFilter ? 'Nenhum card desse tipo.' : 'Nada foi revelado ainda.'}</Status>
      ) : null}

      {visible.length > 0 ? (
        <ul className={styles.list}>
          {visible.map((entity) => {
            const secret = entity.visibility === 'dm';
            return (
              <li key={entity.id}>
                <Link to={`e/${entity.id}`} className={secret ? styles.secretItem : styles.item}>
                  <span className={styles.row}>
                    <TypeChip type={entity.type} />
                    {secret ? (
                      <span className={styles.secretMark}>
                        <LockIcon />
                        Só o mestre
                      </span>
                    ) : null}
                  </span>
                  <span className={styles.name}>{entity.name}</span>
                  {entity.summary ? <span className={styles.summary}>{entity.summary}</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </>
  );
}

function PreviewNote() {
  return (
    <p className={styles.preview}>
      <EyeIcon />
      Vendo como player: o que está escondido não aparece.
    </p>
  );
}
