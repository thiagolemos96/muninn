import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase.ts';
import { useViewer } from '../campaigns/queries.ts';

// Everything this viewer may read in the campaign, for the in-browser index.
// RLS filters it before it leaves the database.
export function useSearchCorpus(campaignId: string, enabled: boolean) {
  const viewer = useViewer();

  return useQuery({
    // Same prefixes as the card queries, so saving a card refreshes the index too
    queryKey: ['entities', 'search', viewer.id, campaignId],
    enabled: enabled && viewer.ready,
    queryFn: async () => {
      const [cards, blocks] = await Promise.all([
        supabase
          .from('entities')
          .select('id, type, name, summary, tags, visibility')
          .eq('campaign_id', campaignId),
        supabase
          .from('blocks')
          .select('entity_id, title, body_md, visibility')
          .eq('campaign_id', campaignId),
      ]);
      if (cards.error) throw cards.error;
      if (blocks.error) throw blocks.error;
      return { cards: cards.data, blocks: blocks.data };
    },
  });
}
