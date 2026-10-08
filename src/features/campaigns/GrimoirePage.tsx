import { Link } from 'react-router';
import { LockIcon } from '../../components/icons.tsx';
import { Status } from '../../components/Status.tsx';
import { TypeChip } from '../../components/TypeChip.tsx';
import { useEntities } from '../cards/queries.ts';
import { useCampaignContext } from './campaignContext.ts';
import styles from './GrimoirePage.module.css';

// "/c/:slug": every card this viewer may see. Anonymous visitors get only the
// revealed ones; the DM also gets the hidden ones, marked.
export function GrimoirePage() {
  const campaign = useCampaignContext();
  const entities = useEntities(campaign.id);

  return (
    <>
      <title>{`${campaign.name} · Muninn`}</title>
      <h1 className={styles.heading}>Grimório</h1>

      {/* Only the DM can load a closed campaign, so this note is for them */}
      {!campaign.is_public ? (
        <p className={styles.closed}>
          <LockIcon />
          Grimório fechado: por enquanto, só você vê esta página.
        </p>
      ) : null}

      {entities.isPending ? <Status>Carregando…</Status> : null}
      {entities.isError ? (
        <Status>Não deu pra carregar os cards: {entities.error.message}</Status>
      ) : null}
      {entities.data?.length === 0 ? <Status>Nada foi revelado ainda.</Status> : null}

      {entities.data && entities.data.length > 0 ? (
        <ul className={styles.list}>
          {entities.data.map((entity) => {
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
