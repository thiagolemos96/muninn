import { Link, useParams } from 'react-router';
import { BlockSection } from '../../components/BlockSection.tsx';
import { CardHeader } from '../../components/CardHeader.tsx';
import { LockIcon } from '../../components/icons.tsx';
import { Status } from '../../components/Status.tsx';
import { useCampaignContext } from '../campaigns/campaignContext.ts';
import { useViewMode } from '../campaigns/viewMode.ts';
import { LinksSection } from './LinksSection.tsx';
import { useBlocks, useEntity, useLinks, useSessionNumbers } from './queries.ts';
import { visibilityLabel } from './visibilityLabel.ts';
import styles from './CardPage.module.css';

// "/c/:slug/e/:id": the card with every block this viewer may see.
// The DM also gets the 'dm' blocks, drawn as secret blocks.
export function CardPage() {
  const { id = '' } = useParams();
  const campaign = useCampaignContext();
  const entity = useEntity(campaign.id, id);
  const blocks = useBlocks(entity.data?.id);
  const links = useLinks(entity.data?.id);
  const sessionNumbers = useSessionNumbers(campaign.id);
  const { isDm, asPlayer } = useViewMode(campaign.id);

  // In the DM's player preview, hide what the public RLS policies would hide
  const hiddenFromPlayer = asPlayer && (!campaign.is_public || entity.data?.visibility === 'dm');

  if (entity.isPending) return <Status>Carregando…</Status>;
  if (entity.isError) return <Status>Não deu pra abrir o card: {entity.error.message}</Status>;
  if (!entity.data || hiddenFromPlayer) {
    return <Status>Esse card não existe ou ainda não foi revelado.</Status>;
  }

  const card = entity.data;
  const numbers = sessionNumbers.data ?? new Map<string, number>();
  const visibleBlocks = blocks.data?.filter((block) => !asPlayer || block.visibility === 'party');

  return (
    <article>
      <title>{`${card.name} · ${campaign.name}`}</title>

      {isDm && !asPlayer ? (
        <div className={styles.dmBar}>
          {card.visibility === 'dm' ? (
            <p className={styles.hidden}>
              <LockIcon />
              Card escondido: os players ainda não veem.
            </p>
          ) : (
            <span />
          )}
          <Link to="editar" className={styles.edit}>
            Editar
          </Link>
        </div>
      ) : null}

      <CardHeader type={card.type} name={card.name} summary={card.summary} />

      {blocks.isPending ? <Status>Carregando…</Status> : null}
      {blocks.isError ? (
        <Status>Não deu pra carregar o texto do card: {blocks.error.message}</Status>
      ) : null}

      {visibleBlocks?.map((block) => (
        <BlockSection
          key={block.id}
          title={block.title}
          bodyMd={block.body_md}
          secret={block.visibility === 'dm'}
          label={visibilityLabel(block.visibility, block.revealed_in, numbers)}
        />
      ))}

      {links.data ? (
        <LinksSection
          entityId={card.id}
          slug={campaign.slug}
          links={links.data}
          asPlayer={asPlayer}
        />
      ) : null}
    </article>
  );
}
