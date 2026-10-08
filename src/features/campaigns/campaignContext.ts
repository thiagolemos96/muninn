import { useOutletContext } from 'react-router';
import type { CampaignSummary } from './queries.ts';

// GrimoireLayout loads the campaign once and hands it to the pages below it
export function useCampaignContext() {
  return useOutletContext<CampaignSummary>();
}
