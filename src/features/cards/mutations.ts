import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Enums } from '../../lib/database.types.ts';
import { supabase } from '../../lib/supabase.ts';
import type { EntityType } from './entityTypes.ts';

type Visibility = Enums<'visibility'>;

export type CardDraft = {
  id: string;
  type: EntityType;
  name: string;
  summary: string;
  tags: string[];
  visibility: Visibility;
};

export type BlockDraft = {
  id: string;
  title: string;
  body_md: string;
  visibility: Visibility;
};

// Direction matters for the sentence: "{from} {label} {to}"
export type LinkDraft = {
  id: string;
  fromId: string;
  toId: string;
  label: string;
  visibility: Visibility;
};

type SaveInput = {
  campaignId: string;
  card: CardDraft;
  blocks: BlockDraft[];
  links: LinkDraft[];
  // Rows that existed when the editor opened and were removed since
  removedBlockIds: string[];
  removedLinkIds: string[];
};

// Ids are created in the browser (crypto.randomUUID), so a new card and its new blocks
// go in a single upsert each, and the editor knows where to navigate before saving.
// Not atomic: if a step fails, what was saved before it stays. Every write is still
// checked by RLS (only the DM of the campaign gets through).
export function useSaveCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      campaignId,
      card,
      blocks,
      links,
      removedBlockIds,
      removedLinkIds,
    }: SaveInput) => {
      const entity = await supabase.from('entities').upsert({
        id: card.id,
        campaign_id: campaignId,
        type: card.type,
        name: card.name.trim(),
        summary: card.summary.trim() || null,
        tags: card.tags,
        visibility: card.visibility,
        updated_at: new Date().toISOString(),
      });
      if (entity.error) throw entity.error;

      if (removedBlockIds.length > 0) {
        const removed = await supabase.from('blocks').delete().in('id', removedBlockIds);
        if (removed.error) throw removed.error;
      }

      if (blocks.length > 0) {
        const saved = await supabase.from('blocks').upsert(
          blocks.map((block, index) => ({
            id: block.id,
            entity_id: card.id,
            campaign_id: campaignId,
            sort_order: index,
            title: block.title.trim() || null,
            body_md: block.body_md,
            visibility: block.visibility,
          })),
        );
        if (saved.error) throw saved.error;
      }

      // Links last: a new card must exist before anything can point to it
      if (removedLinkIds.length > 0) {
        const removed = await supabase.from('links').delete().in('id', removedLinkIds);
        if (removed.error) throw removed.error;
      }

      if (links.length > 0) {
        const saved = await supabase.from('links').upsert(
          links.map((link) => ({
            id: link.id,
            campaign_id: campaignId,
            from_id: link.fromId,
            to_id: link.toId,
            label: link.label.trim(),
            visibility: link.visibility,
          })),
        );
        if (saved.error) throw saved.error;
      }
      return card.id;
    },
    onSuccess: () => invalidateCards(queryClient),
  });
}

// Blocks and links go with it (on delete cascade in the schema)
export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('entities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidateCards(queryClient),
  });
}

function invalidateCards(queryClient: ReturnType<typeof useQueryClient>) {
  for (const key of ['entities', 'entity', 'blocks', 'links']) {
    void queryClient.invalidateQueries({ queryKey: [key] });
  }
}
