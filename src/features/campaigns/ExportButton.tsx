import { useState } from 'react';
import { exportCampaign } from './exportCampaign.ts';
import type { CampaignSummary } from './queries.ts';
import styles from './GrimoirePage.module.css';

// "Exportar campanha (JSON)" from the hosting mitigations in docs/escopo.md
export function ExportButton({ campaign }: { campaign: CampaignSummary }) {
  const [state, setState] = useState<'idle' | 'working' | 'error'>('idle');

  async function handleExport() {
    setState('working');
    try {
      await exportCampaign(campaign);
      setState('idle');
    } catch {
      setState('error');
    }
  }

  return (
    <button
      type="button"
      className={styles.importLink}
      disabled={state === 'working'}
      title={state === 'error' ? 'Não deu pra exportar. Tente de novo.' : 'Baixa um backup em JSON'}
      onClick={() => void handleExport()}
    >
      {state === 'working' ? 'Exportando…' : state === 'error' ? 'Exportar (falhou)' : 'Exportar'}
    </button>
  );
}
