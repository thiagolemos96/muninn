import { supabase } from '../../lib/supabase.ts';
import type { CampaignSummary } from './queries.ts';

// Backup of a campaign in the import format (docs/importador.md), so the file can be
// imported back. Extra fields the importer ignores: muninn, campaign, exported_at,
// sessions and each card's image (Storage path only; the picture itself is not included).
export async function exportCampaign(campaign: CampaignSummary) {
  const [cards, blocks, links, sessions] = await Promise.all([
    supabase
      .from('entities')
      .select('id, type, name, summary, tags, image_path, visibility')
      .eq('campaign_id', campaign.id)
      .order('name'),
    supabase
      .from('blocks')
      .select('entity_id, title, body_md, visibility, sort_order')
      .eq('campaign_id', campaign.id)
      .order('sort_order'),
    supabase
      .from('links')
      .select('from_id, to_id, label, visibility')
      .eq('campaign_id', campaign.id)
      .order('label'),
    supabase
      .from('sessions')
      .select('number, title, played_on, recap_md')
      .eq('campaign_id', campaign.id)
      .order('number'),
  ]);
  for (const result of [cards, blocks, links, sessions]) {
    if (result.error) throw result.error;
  }

  const nameOf = new Map((cards.data ?? []).map((card) => [card.id, card.name]));
  const data = {
    muninn: 1,
    campaign: campaign.name,
    exported_at: new Date().toISOString(),
    cards: (cards.data ?? []).map((card) => ({
      type: card.type,
      name: card.name,
      summary: card.summary ?? undefined,
      tags: card.tags,
      visibility: card.visibility,
      image: card.image_path ?? undefined,
      blocks: (blocks.data ?? [])
        .filter((block) => block.entity_id === card.id)
        .map((block) => ({
          title: block.title ?? undefined,
          body: block.body_md,
          visibility: block.visibility,
        })),
    })),
    links: (links.data ?? []).map((link) => ({
      from: nameOf.get(link.from_id),
      label: link.label,
      to: nameOf.get(link.to_id),
      visibility: link.visibility,
    })),
    sessions: sessions.data ?? [],
  };

  const date = new Date().toISOString().slice(0, 10);
  download(`muninn-${campaign.slug}-${date}.json`, JSON.stringify(data, null, 2));
  return { cards: data.cards.length, links: data.links.length };
}

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  // Revoking right away can cancel the download in some browsers
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
