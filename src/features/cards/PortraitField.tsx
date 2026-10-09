import { useEffect, useState } from 'react';
import { Portrait } from '../../components/Portrait.tsx';
import { compressImage } from '../../lib/image.ts';
import type { ImageChange } from './mutations.ts';
import { useSignedImage } from './queries.ts';
import styles from './CardEditorPage.module.css';

// Picks, compresses and previews the portrait. Nothing is uploaded here:
// the save does it, after the card exists (Storage policy).
export function PortraitField({
  currentPath,
  change,
  onChange,
}: {
  currentPath: string | null;
  change: ImageChange;
  onChange: (change: ImageChange) => void;
}) {
  const current = useSignedImage(currentPath);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  // Free the in-memory preview when it is replaced or the editor closes
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setProblem(null);
    setWorking(true);
    try {
      const blob = await compressImage(file);
      setPreviewUrl(URL.createObjectURL(blob));
      onChange({ kind: 'replace', blob });
    } catch {
      setProblem('Não deu pra ler essa imagem. Tente um JPG, PNG ou WebP.');
    } finally {
      setWorking(false);
    }
  }

  const shown =
    change.kind === 'replace' ? previewUrl : change.kind === 'remove' ? null : current.data;
  const hasPicture = change.kind === 'replace' || (change.kind === 'keep' && currentPath !== null);

  return (
    <div className={styles.portraitField}>
      <Portrait src={shown} alt="Prévia do retrato" />
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Retrato</span>
        {/* The native file button speaks the browser's language; ours speaks pt-BR */}
        <label className={styles.fileButton}>
          <input
            id="card-portrait"
            type="file"
            accept="image/*"
            disabled={working}
            className={styles.visuallyHidden}
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          {hasPicture ? 'Trocar imagem' : 'Escolher imagem'}
        </label>
        <p className={styles.hint}>
          {working
            ? 'Comprimindo…'
            : change.kind === 'replace'
              ? `Pronto pra salvar: ${Math.round(change.blob.size / 1024)} KB em WebP.`
              : 'Vira WebP com até 1600 px antes de subir. Quem vê o card vê o retrato.'}
        </p>
        {hasPicture ? (
          <button
            type="button"
            className={styles.button}
            onClick={() => onChange(currentPath ? { kind: 'remove' } : { kind: 'keep' })}
          >
            Remover retrato
          </button>
        ) : null}
        {problem ? (
          <p className={styles.error} role="alert">
            {problem}
          </p>
        ) : null}
      </div>
    </div>
  );
}
