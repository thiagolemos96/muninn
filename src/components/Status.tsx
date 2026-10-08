import type { ReactNode } from 'react';
import styles from './Status.module.css';

// Loading, empty and error messages share one quiet style
export function Status({ children }: { children: ReactNode }) {
  return (
    <p className={styles.status} role="status">
      {children}
    </p>
  );
}
