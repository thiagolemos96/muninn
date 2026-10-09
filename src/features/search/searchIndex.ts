import MiniSearch from 'minisearch';
import { TYPE_LABEL, type EntityType } from '../cards/entityTypes.ts';

export type SearchCard = {
  id: string;
  type: EntityType;
  name: string;
  summary: string | null;
  tags: string[];
  visibility: 'dm' | 'party';
};

export type SearchBlock = {
  entity_id: string;
  title: string | null;
  body_md: string;
  visibility: 'dm' | 'party';
};

type SearchDoc = {
  id: string;
  type: EntityType;
  name: string;
  kind: string;
  summary: string;
  tags: string;
  text: string;
  secret: boolean;
};

// "Facção" and "faccao" are the same word at the table: lowercase and drop accents
export function normalize(term: string) {
  return term
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

// Field weights: the name is what people shout across the table
const BOOST = { name: 4, kind: 2, tags: 2, summary: 1.5, text: 1 };

// One document per card, its blocks folded into `text`. Built only from what RLS
// returned, so a player's index never contains a secret. `asPlayer` drops what the
// DM's player preview hides.
export function buildIndex(cards: SearchCard[], blocks: SearchBlock[], asPlayer: boolean) {
  const visibleCards = cards.filter((card) => !asPlayer || card.visibility === 'party');
  const textByCard = new Map<string, string[]>();
  for (const block of blocks) {
    if (asPlayer && block.visibility !== 'party') continue;
    const parts = textByCard.get(block.entity_id) ?? [];
    parts.push(block.title ?? '', block.body_md);
    textByCard.set(block.entity_id, parts);
  }

  const index = new MiniSearch<SearchDoc>({
    fields: ['name', 'kind', 'tags', 'summary', 'text'],
    storeFields: ['type', 'name', 'summary', 'secret'],
    processTerm: (term) => normalize(term),
    searchOptions: {
      boost: BOOST,
      prefix: true,
      fuzzy: 0.2,
      combineWith: 'AND',
    },
  });

  index.addAll(
    visibleCards.map((card) => ({
      id: card.id,
      type: card.type,
      name: card.name,
      kind: TYPE_LABEL[card.type],
      summary: card.summary ?? '',
      tags: card.tags.join(' '),
      text: (textByCard.get(card.id) ?? []).join('\n'),
      secret: card.visibility === 'dm',
    })),
  );
  return index;
}

export type SearchHit = {
  id: string;
  type: EntityType;
  name: string;
  summary: string;
  secret: boolean;
};

export function searchCards(index: MiniSearch<SearchDoc>, query: string, limit = 20): SearchHit[] {
  if (!query.trim()) return [];
  return index
    .search(query)
    .slice(0, limit)
    .map((result) => ({
      id: result.id as string,
      type: result.type as EntityType,
      name: result.name as string,
      summary: result.summary as string,
      secret: result.secret as boolean,
    }));
}
