import { Link } from 'react-router';
import { BackIcon, EyeIcon } from '../../components/icons.tsx';
import { Switch } from '../../components/Switch.tsx';
import { useSessionNumbers } from '../cards/queries.ts';
import { SearchButton } from '../search/SearchButton.tsx';
import { ThemeToggle } from '../theme/ThemeToggle.tsx';
import { useUiStore } from '../ui/uiStore.ts';
import { useSetCampaignPublic, type CampaignSummary } from './queries.ts';
import styles from './DmTopBar.module.css';

// docs/design.md, component 10 (Escudo).
export function DmTopBar({ campaign, backTo }: { campaign: CampaignSummary; backTo?: string }) {
  const sessions = useSessionNumbers(campaign.id);
  const setPublic = useSetCampaignPublic();
  const viewAsPlayer = useUiStore((state) => state.viewAsPlayer);
  const toggleViewAsPlayer = useUiStore((state) => state.toggleViewAsPlayer);

  // The current session is the highest number (schema comment on sessions)
  const current =
    sessions.data && sessions.data.size > 0 ? Math.max(...sessions.data.values()) : null;

  return (
    <header className={styles.top}>
      <div className={styles.identity}>
        {backTo ? (
          <Link to={backTo} className={styles.back} aria-label="Voltar pros cards">
            <BackIcon />
          </Link>
        ) : null}
        <Link to="/" className={styles.brand}>
          Muninn
        </Link>
        <span className={styles.campaign}>{campaign.name}</span>
      </div>

      <div className={styles.actions}>
        <SearchButton variant="wide" />
        {current !== null ? <span className={styles.session}>Sessão {current}</span> : null}
        <button
          type="button"
          className={styles.preview}
          aria-pressed={viewAsPlayer}
          onClick={toggleViewAsPlayer}
        >
          <EyeIcon />
          Ver como player
        </button>
        <Switch
          label="Grimório aberto"
          checked={campaign.is_public}
          disabled={setPublic.isPending}
          onChange={(isPublic) => setPublic.mutate({ id: campaign.id, isPublic })}
        />
        <ThemeToggle />
      </div>
      {setPublic.isError ? (
        <p className={styles.error} role="alert">
          Não deu pra mudar o Grimório: {setPublic.error.message}
        </p>
      ) : null}
    </header>
  );
}
