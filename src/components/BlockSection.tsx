import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EyeIcon, LockIcon } from './icons.tsx';
import styles from './BlockSection.module.css';

type Props = {
  title: string | null;
  bodyMd: string;
  secret: boolean;
  label: string;
  // Drop cap on the first paragraph (docs/design.md, component 2): only the card's first block
  dropCap?: boolean;
};

// docs/design.md, components 4 (block section) and 5 (secret block).
// The "Revelar ao grupo" button arrives in phase 2.
export function BlockSection({ title, bodyMd, secret, label, dropCap = false }: Props) {
  return (
    <section className={secret ? styles.secret : styles.block}>
      <div className={styles.head}>
        {title ? <h2 className={styles.title}>{title}</h2> : null}
        <span className={styles.label}>
          {secret ? <LockIcon /> : <EyeIcon />}
          {label}
        </span>
      </div>
      {/* react-markdown never renders raw HTML, so block text cannot inject markup */}
      <div className={dropCap ? `${styles.body} ${styles.dropCap}` : styles.body}>
        <Markdown remarkPlugins={[remarkGfm]}>{bodyMd}</Markdown>
      </div>
    </section>
  );
}
