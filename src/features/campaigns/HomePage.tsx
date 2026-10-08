import { useState } from 'react';
import { Link } from 'react-router';
import { Status } from '../../components/Status.tsx';
import { signInWithGoogle, signOut, useDmSession } from '../auth/useDmSession.ts';
import { ThemeToggle } from '../theme/ThemeToggle.tsx';
import { useMyCampaigns } from './queries.ts';
import styles from './HomePage.module.css';

// "/": the DM's door (Escudo). Players never need this page.
export function HomePage() {
  const auth = useDmSession();

  return (
    <div className={styles.page}>
      <title>Muninn</title>
      <header className={styles.top}>
        <span className={styles.brand}>Muninn</span>
        <div className={styles.actions}>
          {auth.status === 'signed-in' ? (
            <button type="button" className={styles.button} onClick={() => void signOut()}>
              Sair
            </button>
          ) : null}
          <ThemeToggle />
        </div>
      </header>
      <main className={styles.main}>
        {auth.status === 'loading' ? <Status>Carregando…</Status> : null}
        {auth.status === 'signed-out' ? <SignIn /> : null}
        {auth.status === 'signed-in' ? <MyCampaigns email={auth.session.user.email} /> : null}
      </main>
    </div>
  );
}

function SignIn() {
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
  }

  return (
    <section className={styles.signIn}>
      <h1 className={styles.heading}>Escudo do mestre</h1>
      <p>Só o mestre entra aqui. Os players abrem o Grimório pelo link, sem login.</p>
      <button type="button" className={styles.primary} onClick={() => void handleSignIn()}>
        Entrar com Google
      </button>
      {error ? <p className={styles.error}>Não deu pra entrar: {error}</p> : null}
    </section>
  );
}

function MyCampaigns({ email }: { email: string | undefined }) {
  const campaigns = useMyCampaigns();

  return (
    <section>
      <h1 className={styles.heading}>Suas campanhas</h1>
      {campaigns.isPending ? <Status>Carregando…</Status> : null}
      {campaigns.isError ? (
        <Status>Não deu pra carregar as campanhas: {campaigns.error.message}</Status>
      ) : null}
      {campaigns.data?.length === 0 ? (
        <Status>
          Você ainda não é mestre de nenhuma campanha. Rode o supabase/seed.example.sql com o e-mail{' '}
          {email ?? 'desta conta'}.
        </Status>
      ) : null}
      {campaigns.data && campaigns.data.length > 0 ? (
        <ul className={styles.list}>
          {campaigns.data.map((campaign) => (
            <li key={campaign.id}>
              <Link to={`/c/${campaign.slug}`} className={styles.campaign}>
                <span className={styles.campaignName}>{campaign.name}</span>
                <span className={styles.campaignState}>
                  {campaign.is_public ? 'Grimório aberto' : 'Grimório fechado'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <p className={styles.who}>Entrou como {email}</p>
    </section>
  );
}
