import { signInWithGoogle, signOut, useDmSession } from '../features/auth/useDmSession.ts';
import { ThemeToggle } from '../features/theme/ThemeToggle.tsx';
import styles from './App.module.css';

// Temporary shell until the routes land in step 5
export function App() {
  const auth = useDmSession();

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <span className={styles.brand}>Muninn</span>
        <div className={styles.actions}>
          {auth.status === 'signed-in' ? (
            <>
              <span className={styles.who}>{auth.session.user.email}</span>
              <button type="button" className={styles.button} onClick={() => void signOut()}>
                Sair
              </button>
            </>
          ) : (
            <button
              type="button"
              className={styles.button}
              disabled={auth.status === 'loading'}
              onClick={() => void signInWithGoogle()}
            >
              Entrar com Google
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>
      <main className={styles.main}>
        <h1 className={styles.name}>Frickz</h1>
        <p className={styles.kind}>NPC, goblin artífice</p>
        <p>
          Alegreya no texto de conteúdo, com entrelinha de 1.55 e no máximo uns 75 caracteres por
          linha. A interface usa Alegreya Sans.
        </p>
      </main>
    </div>
  );
}
