import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase.ts';
import { useViewer } from '../campaigns/queries.ts';

// No filter on visibility anywhere in this file: RLS already returns only what
// this viewer may see. The UI just marks the 'dm' rows the DM gets back.

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useEntities(campaignId: string) {
  const viewer = useViewer();

  return useQuery({
    queryKey: ['entities', viewer.id, campaignId],
    enabled: viewer.ready,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entities')
        .select('id, type, name, summary, visibility')
        .eq('campaign_id', campaignId)
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

// null means "not found or not revealed yet"
export function useEntity(campaignId: string, id: string) {
  const viewer = useViewer();

  return useQuery({
    queryKey: ['entity', viewer.id, campaignId, id],
    enabled: viewer.ready,
    queryFn: async () => {
      // A malformed id would make Postgres throw; treat it as a missing card
      if (!uuidPattern.test(id)) return null;
      const { data, error } = await supabase
        .from('entities')
        .select('id, type, name, summary, tags, image_path, visibility')
        .eq('campaign_id', campaignId)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useBlocks(entityId: string | undefined) {
  const viewer = useViewer();

  return useQuery({
    queryKey: ['blocks', viewer.id, entityId],
    enabled: viewer.ready && entityId !== undefined,
    queryFn: async () => {
      if (!entityId) return [];
      const { data, error } = await supabase
        .from('blocks')
        .select('id, title, body_md, visibility, revealed_in')
        .eq('entity_id', entityId)
        .order('sort_order')
        .order('id');
      if (error) throw error;
      return data;
    },
  });
}

// Links in both directions, with both ends embedded. RLS applies to the embedded
// cards too, so an end this viewer may not see comes back as null.
export function useLinks(entityId: string | undefined) {
  const viewer = useViewer();

  return useQuery({
    queryKey: ['links', viewer.id, entityId],
    enabled: viewer.ready && entityId !== undefined,
    queryFn: async () => {
      if (!entityId || !uuidPattern.test(entityId)) return [];
      const { data, error } = await supabase
        .from('links')
        .select(
          `id, label, visibility, revealed_in,
           from:entities!links_from_id_campaign_id_fkey(id, name, type, visibility),
           to:entities!links_to_id_campaign_id_fkey(id, name, type, visibility)`,
        )
        .or(`from_id.eq.${entityId},to_id.eq.${entityId}`)
        .order('label');
      if (error) throw error;
      return data;
    },
  });
}

// sessions.id -> sessions.number, for "Grupo, desde a sessão N"
export function useSessionNumbers(campaignId: string) {
  const viewer = useViewer();

  return useQuery({
    queryKey: ['session-numbers', viewer.id, campaignId],
    enabled: viewer.ready,
    queryFn: async (): Promise<ReadonlyMap<string, number>> => {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, number')
        .eq('campaign_id', campaignId);
      if (error) throw error;
      return new Map(data.map((s) => [s.id, s.number]));
    },
  });
}

// Private bucket: the picture is shown through a short-lived signed URL. Creating it
// passes through the Storage policies, so a player only gets one for a revealed card.
export function useSignedImage(path: string | null) {
  const viewer = useViewer();

  return useQuery({
    queryKey: ['image', viewer.id, path],
    enabled: viewer.ready && path !== null,
    staleTime: 50 * 60_000, // the URL lives one hour; renew before it expires
    queryFn: async () => {
      if (!path) return null;
      const { data, error } = await supabase.storage.from('assets').createSignedUrl(path, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
