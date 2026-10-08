import { Status } from '../components/Status.tsx';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <main className={styles.main}>
      <title>Muninn</title>
      <Status>Esta página não existe. Confira o link.</Status>
    </main>
  );
}
