import { useState } from 'react';
import { Link } from 'react-router';
import { Status } from '../../components/Status.tsx';
import { TypeChip } from '../../components/TypeChip.tsx';
import { useCampaignContext } from '../campaigns/campaignContext.ts';
import { useViewMode } from '../campaigns/viewMode.ts';
import { useSearchCorpus } from '../search/queries.ts';
import { useCampaignLinks, useRunImport } from './importData.ts';
import { planImport, type ImportPlan } from './importPlan.ts';
import editorStyles from '../cards/CardEditorPage.module.css';
import styles from './ImportPage.module.css';

// "/c/:slug/importar": paste or pick a JSON (docs/importador.md), check, then import.
export function ImportPage() {
  const campaign = useCampaignContext();
  const { isDm, ready } = useViewMode(campaign.id);
  const corpus = useSearchCorpus(campaign.id, isDm);
  const links = useCampaignLinks(campaign.id);
  const run = useRunImport();

  const [text, setText] = useState('');
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState<string | null>(null);

  if (!ready) return <Status>Carregando…</Status>;
  if (!isDm) return <Status>Só o mestre importa cards.</Status>;
  if (corpus.isPending || links.isPending) return <Status>Carregando…</Status>;
  if (corpus.isError) return <Status>Não deu pra ler a campanha: {corpus.error.message}</Status>;
  if (links.isError) return <Status>Não deu pra ler as relações: {links.error.message}</Status>;

  function check() {
    if (!corpus.data || !links.data) return;
    setDone(null);
    const result = planImport(text, {
      cards: corpus.data.cards,
      blocks: corpus.data.blocks,
      links: links.data,
    });
    if (result.ok) {
      setPlan(result.plan);
      setErrors([]);
    } else {
      setPlan(null);
      setErrors(result.errors);
    }
  }

  function runImport() {
    if (!plan) return;
    const created = plan.cards.filter((card) => card.isNew).length;
    const blocks = plan.cards.reduce((sum, card) => sum + card.blocks.length, 0);
    run.mutate(
      { campaignId: campaign.id, plan },
      {
        onSuccess: () => {
          setDone(
            `Importado: ${created} card(s) novo(s), ${blocks} bloco(s) e ${plan.links.length} relação(ões).`,
          );
          setPlan(null);
          setText('');
        },
      },
    );
  }

  async function readFile(file: File | undefined) {
    if (!file) return;
    setText(await file.text());
    setPlan(null);
    setErrors([]);
  }

  return (
    <div className={editorStyles.form}>
      <title>{`Importar · ${campaign.name}`}</title>
      <h1 className={editorStyles.heading}>Importar cards</h1>
      <p className={editorStyles.hint}>
        Cole o JSON ou escolha o arquivo. O formato está em docs/importador.md. Nada é apagado nem
        sobrescrito: card que já existe só ganha os blocos que ainda não tem.
      </p>

      <label className={editorStyles.fileButton}>
        <input
          type="file"
          accept=".json,application/json"
          className={editorStyles.visuallyHidden}
          onChange={(event) => void readFile(event.target.files?.[0])}
        />
        Escolher arquivo
      </label>

      <div className={editorStyles.field}>
        <label htmlFor="import-json">JSON</label>
        <textarea
          id="import-json"
          rows={12}
          spellCheck={false}
          className={styles.code}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setPlan(null);
          }}
        />
      </div>

      <div className={editorStyles.footer}>
        <button
          type="button"
          className={editorStyles.button}
          disabled={!text.trim()}
          onClick={check}
        >
          Conferir
        </button>
        <Link to={`/c/${campaign.slug}`} className={editorStyles.button}>
          Voltar aos cards
        </Link>
      </div>

      {errors.length > 0 ? (
        <div className={styles.errors} role="alert">
          <p>Corrija antes de importar:</p>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {done ? (
        <p className={styles.done} role="status">
          {done} <Link to={`/c/${campaign.slug}`}>Ver os cards</Link>
        </p>
      ) : null}

      {plan ? <Preview plan={plan} /> : null}

      {plan ? (
        <>
          {run.isError ? (
            <p className={editorStyles.error} role="alert">
              Não deu pra importar: {run.error.message}
            </p>
          ) : null}
          <div className={editorStyles.footer}>
            <button
              type="button"
              className={editorStyles.primary}
              disabled={run.isPending || isEmpty(plan)}
              onClick={runImport}
            >
              {run.isPending ? 'Importando…' : 'Importar'}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

const isEmpty = (plan: ImportPlan) =>
  plan.links.length === 0 && plan.cards.every((card) => !card.isNew && card.blocks.length === 0);

function Preview({ plan }: { plan: ImportPlan }) {
  return (
    <section className={styles.preview}>
      <h2 className={editorStyles.subheading}>O que vai acontecer</h2>
      {isEmpty(plan) ? <p className={editorStyles.hint}>Nada novo: tudo isso já existe.</p> : null}

      <ul className={styles.list}>
        {plan.cards.map((card) => (
          <li key={card.id} className={styles.row}>
            <TypeChip type={card.type} />
            <strong>{card.name}</strong>
            <span className={styles.what}>
              {card.isNew ? 'novo' : 'já existe'}
              {card.blocks.length > 0 ? `, +${card.blocks.length} bloco(s)` : ''}
              {card.skippedBlocks > 0 ? `, ${card.skippedBlocks} bloco(s) já existiam` : ''}
              {card.isNew && card.visibility === 'party' ? ', visível pro grupo' : ''}
            </span>
          </li>
        ))}
      </ul>

      {plan.links.length > 0 || plan.skippedLinks > 0 ? (
        <>
          <h3 className={styles.minor}>Relações</h3>
          <ul className={styles.list}>
            {plan.links.map((link) => (
              <li key={link.id} className={styles.row}>
                <strong>{link.fromName}</strong>
                <em>{link.label}</em>
                <strong>{link.toName}</strong>
              </li>
            ))}
          </ul>
          {plan.skippedLinks > 0 ? (
            <p className={editorStyles.hint}>{plan.skippedLinks} relação(ões) já existiam.</p>
          ) : null}
        </>
      ) : null}

      {plan.warnings.map((warning) => (
        <p key={warning} className={editorStyles.hint}>
          Aviso: {warning}
        </p>
      ))}
    </section>
  );
}
