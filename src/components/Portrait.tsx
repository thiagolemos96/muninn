import styles from './Portrait.module.css';

// docs/design.md, component 3: inset background, gilt border with a second inner line.
// Without a picture it shows "[retrato]" in italics.
export function Portrait({ src, alt }: { src: string | null | undefined; alt: string }) {
  return (
    <figure className={styles.portrait}>
      {src ? (
        <img src={src} alt={alt} className={styles.image} />
      ) : (
        <span className={styles.empty}>[retrato]</span>
      )}
    </figure>
  );
}
