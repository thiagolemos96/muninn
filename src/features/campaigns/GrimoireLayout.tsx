import { Link, Outlet, useParams } from 'react-router';
import { BottomNav } from '../../components/BottomNav.tsx';
import { BackIcon } from '../../components/icons.tsx';
import { Status } from '../../components/Status.tsx';
import { SearchButton } from '../search/SearchButton.tsx';
import { SearchDialog } from '../search/SearchDialog.tsx';
import { ThemeToggle } from '../theme/ThemeToggle.tsx';
import { DmSidebar } from './DmSidebar.tsx';
import { DmTopBar } from './DmTopBar.tsx';
import { useCampaign, useIsDm } from './queries.ts';
import styles from './GrimoireLayout.module.css';

// "/c/:slug/*": same pages for players and the DM; RLS decides what each one gets.
// The DM gets the Escudo chrome around them (top bar with controls, sidebar on desktop).
export function GrimoireLayout() {
  const { slug = '', id } = useParams();
  const campaign = useCampaign(slug);
  const { isDm, ready } = useIsDm(campaign.data?.id ?? '');
  const backTo = id ? `/c/${slug}` : undefined;

  // Pick the chrome only once we know who is looking
  if (campaign.isPending || (campaign.data && !ready)) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <Status>Carregando…</Status>
        </main>
      </div>
    );
  }

  const body = (
    <>
      {campaign.isPending ? <Status>Carregando…</Status> : null}
      {campaign.isError ? (
        <Status>Não deu pra abrir o Grimório: {campaign.error.message}</Status>
      ) : null}
      {campaign.isSuccess && !campaign.data ? (
        <Status>Esse Grimório está fechado ou o link está errado.</Status>
      ) : null}
      {campaign.data ? <Outlet context={campaign.data} /> : null}
    </>
  );

  if (isDm && campaign.data) {
    return (
      <div className={styles.page}>
        <DmTopBar campaign={campaign.data} backTo={backTo} />
        <div className={styles.columns}>
          <DmSidebar slug={slug} />
          <main className={styles.main}>{body}</main>
        </div>
        <div className={styles.phoneOnly}>
          <BottomNav slug={slug} />
        </div>
        <SearchDialog campaign={campaign.data} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        {backTo ? (
          <Link to={backTo} className={styles.back} aria-label="Voltar pro Grimório">
            <BackIcon />
          </Link>
        ) : (
          <span className={styles.back} aria-hidden="true" />
        )}
        <span className={styles.title}>{campaign.data?.name ?? 'Grimório'}</span>
        <div className={styles.actions}>
          {campaign.data ? <SearchButton variant="icon" /> : null}
          <ThemeToggle />
        </div>
      </header>

      <main className={styles.main}>{body}</main>

      <BottomNav slug={slug} />
      {campaign.data ? <SearchDialog campaign={campaign.data} /> : null}
    </div>
  );
}
