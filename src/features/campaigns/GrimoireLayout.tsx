import { Link, Outlet, useParams } from 'react-router';
import { BottomNav } from '../../components/BottomNav.tsx';
import { BackIcon } from '../../components/icons.tsx';
import { Status } from '../../components/Status.tsx';
import { ThemeToggle } from '../theme/ThemeToggle.tsx';
import { useCampaign } from './queries.ts';
import styles from './GrimoireLayout.module.css';

// "/c/:slug/*": top bar, the page, bottom bar. Same screen for players and the DM;
// RLS decides what each one gets.
export function GrimoireLayout() {
  const { slug = '', id } = useParams();
  const campaign = useCampaign(slug);

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        {id ? (
          <Link to={`/c/${slug}`} className={styles.back} aria-label="Voltar pro Grimório">
            <BackIcon />
          </Link>
        ) : (
          <span className={styles.back} aria-hidden="true" />
        )}
        <span className={styles.title}>{campaign.data?.name ?? 'Grimório'}</span>
        <ThemeToggle />
      </header>

      <main className={styles.main}>
        {campaign.isPending ? <Status>Carregando…</Status> : null}
        {campaign.isError ? (
          <Status>Não deu pra abrir o Grimório: {campaign.error.message}</Status>
        ) : null}
        {campaign.isSuccess && !campaign.data ? (
          <Status>Este Grimório está fechado, ou o link está errado.</Status>
        ) : null}
        {campaign.data ? <Outlet context={campaign.data} /> : null}
      </main>

      <BottomNav slug={slug} />
    </div>
  );
}
