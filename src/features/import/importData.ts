import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase.ts';
import { useViewer } from '../campaigns/queries.ts';
import type { ImportPlan } from './importPlan.ts';

// Links of the whole campaign, to skip relations that already exist
export function useCampaignLinks(campaignId: string) {
  const viewer = useViewer();

  return useQuery({
    queryKey: ['links', 'campaign', viewer.id, campaignId],
    enabled: viewer.ready,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('links')
        .select('from_id, to_id, label')
        .eq('campaign_id', campaignId);
      if (error) throw error;
      return data;
    },
  });
}

// Inserts only: new cards, then blocks, then links (each needs the previous one to exist).
// Not atomic, like the card editor; RLS lets only the DM write.
export function useRunImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, plan }: { campaignId: string; plan: ImportPlan }) => {
      const newCards = plan.cards.filter((card) => card.isNew);
      if (newCards.length > 0) {
        const { error } = await supabase.from('entities').insert(
          newCards.map((card) => ({
            id: card.id,
            campaign_id: campaignId,
            type: card.type,
            name: card.name,
            summary: card.summary,
            tags: card.tags,
            visibility: card.visibility,
          })),
        );
        if (error) throw error;
      }

      const blocks = plan.cards.flatMap((card) =>
        card.blocks.map((block, index) => ({
          id: block.id,
          entity_id: card.id,
          campaign_id: campaignId,
          // Added to an existing card, the new blocks go after the old ones
          sort_order: (card.isNew ? 0 : 1000) + index,
          title: block.title,
          body_md: block.body_md,
          visibility: block.visibility,
        })),
      );
      if (blocks.length > 0) {
        const { error } = await supabase.from('blocks').insert(blocks);
        if (error) throw error;
      }

      if (plan.links.length > 0) {
        const { error } = await supabase.from('links').insert(
          plan.links.map((link) => ({
            id: link.id,
            campaign_id: campaignId,
            from_id: link.fromId,
            to_id: link.toId,
            label: link.label,
            visibility: link.visibility,
          })),
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      for (const key of ['entities', 'entity', 'blocks', 'links']) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}
