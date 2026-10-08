import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase.ts';
import { useDmSession } from '../auth/useDmSession.ts';

// RLS answers differently for the DM and for an anonymous visitor, so the viewer
// is part of every cache key: signing in or out never shows the other's data.
// Queries wait for the session to load, or the first fetch would always be anonymous.
export function useViewer() {
  const auth = useDmSession();
  return {
    ready: auth.status !== 'loading',
    id: auth.status === 'signed-in' ? auth.session.user.id : 'anon',
  };
}

export type CampaignSummary = {
  id: string;
  name: string;
  slug: string;
  is_public: boolean;
};

const campaignColumns = 'id, name, slug, is_public';

// Campaigns where the signed-in user is DM
export function useMyCampaigns() {
  const auth = useDmSession();
  const userId = auth.status === 'signed-in' ? auth.session.user.id : null;

  return useQuery({
    queryKey: ['my-campaigns', userId],
    enabled: userId !== null,
    queryFn: async (): Promise<CampaignSummary[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('campaign_members')
        .select(`campaigns(${campaignColumns})`)
        .eq('user_id', userId)
        .eq('role', 'dm');
      if (error) throw error;
      return data
        .map((member) => member.campaigns)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    },
  });
}

// null means "closed or does not exist": RLS makes both look the same, on purpose
export function useCampaign(slug: string) {
  const viewer = useViewer();

  return useQuery({
    queryKey: ['campaign', viewer.id, slug],
    enabled: viewer.ready,
    queryFn: async (): Promise<CampaignSummary | null> => {
      const { data, error } = await supabase
        .from('campaigns')
        .select(campaignColumns)
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
