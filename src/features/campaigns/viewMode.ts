import { useUiStore } from '../ui/uiStore.ts';
import { useIsDm } from './queries.ts';

// asPlayer: the DM is previewing the Grimório. Screens then hide what the public
// RLS policies would hide (closed campaign, 'dm' cards and blocks). It is only a
// preview: what is fetched is still decided by RLS.
export function useViewMode(campaignId: string) {
  const { isDm, ready } = useIsDm(campaignId);
  const viewAsPlayer = useUiStore((state) => state.viewAsPlayer);
  return { isDm, ready, asPlayer: isDm && viewAsPlayer };
}
