import { ENTITY_TYPES, TYPE_LABEL, type EntityType } from '../cards/entityTypes.ts';
import { normalize } from '../search/searchIndex.ts';

// The import format is documented in docs/importador.md. This file turns a pasted JSON
// into a plan: what gets created, what is added to existing cards, and what is skipped.
// It never plans a delete or an overwrite.

type Visibility = 'dm' | 'party';

export type ExistingCard = { id: string; name: string; type: EntityType };
export type ExistingBlock = { entity_id: string; title: string | null };
export type ExistingLink = { from_id: string; to_id: string; label: string };

export type PlannedBlock = {
  id: string;
  title: string | null;
  body_md: string;
  visibility: Visibility;
};

export type PlannedCard = {
  id: string;
  isNew: boolean;
  type: EntityType;
  name: string;
  summary: string | null;
  tags: string[];
  visibility: Visibility;
  blocks: PlannedBlock[];
  skippedBlocks: number;
};

export type PlannedLink = {
  id: string;
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  label: string;
  visibility: Visibility;
};

export type ImportPlan = {
  cards: PlannedCard[];
  links: PlannedLink[];
  skippedLinks: number;
  warnings: string[];
};

export type PlanResult = { ok: true; plan: ImportPlan } | { ok: false; errors: string[] };

const key = (name: string) => normalize(name).replace(/\s+/g, ' ').trim();

// Accepts the enum ("location") or the label people and LLMs write ("Local", "Facção")
const TYPE_ALIASES = new Map<string, EntityType>(
  ENTITY_TYPES.flatMap((type) => [
    [key(type), type],
    [key(TYPE_LABEL[type]), type],
  ]),
);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function planImport(
  text: string,
  existing: { cards: ExistingCard[]; blocks: ExistingBlock[]; links: ExistingLink[] },
): PlanResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    return { ok: false, errors: [`O texto não é um JSON válido: ${(error as Error).message}`] };
  }
  if (!isObject(data) || !Array.isArray(data.cards)) {
    return { ok: false, errors: ['O JSON precisa de uma lista "cards".'] };
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const existingByKey = new Map(existing.cards.map((card) => [key(card.name), card]));
  const plannedByKey = new Map<string, PlannedCard>();

  const visibilityOf = (value: unknown, where: string): Visibility => {
    if (value === undefined || value === null) return 'dm';
    if (value === 'dm' || value === 'party') return value;
    errors.push(`${where}: visibility deve ser "dm" ou "party".`);
    return 'dm';
  };
  const text_ = (value: unknown) =>
    typeof value === 'string' && value.trim() ? value.trim() : null;

  data.cards.forEach((raw, i) => {
    const where = `cards[${i}]`;
    if (!isObject(raw)) return errors.push(`${where}: cada card é um objeto { }.`);
    const name = text_(raw.name);
    if (!name) return errors.push(`${where}: falta o "name".`);
    const type = TYPE_ALIASES.get(key(String(raw.type ?? '')));
    if (!type) {
      return errors.push(
        `${where} (${name}): tipo "${String(raw.type ?? '')}" não existe. Use npc, location, faction, item ou document.`,
      );
    }
    if (plannedByKey.has(key(name)))
      return errors.push(`${where}: "${name}" aparece duas vezes no JSON.`);
    if (raw.tags !== undefined && !Array.isArray(raw.tags)) {
      errors.push(`${where} (${name}): tags deve ser uma lista, ["goblin", "artífice"].`);
    }
    if (raw.blocks !== undefined && !Array.isArray(raw.blocks)) {
      errors.push(`${where} (${name}): blocks deve ser uma lista.`);
    }

    const match = existingByKey.get(key(name));
    if (match && match.type !== type) {
      warnings.push(
        `"${name}" já existe como ${TYPE_LABEL[match.type]}; o tipo ${TYPE_LABEL[type]} do JSON foi ignorado.`,
      );
    }
    const knownTitles = new Set(
      match
        ? existing.blocks
            .filter((block) => block.entity_id === match.id)
            .map((block) => key(block.title ?? ''))
        : [],
    );

    let skippedBlocks = 0;
    const blocks: PlannedBlock[] = [];
    (Array.isArray(raw.blocks) ? raw.blocks : []).forEach((rawBlock, j) => {
      const blockWhere = `${where}.blocks[${j}]`;
      if (!isObject(rawBlock)) return errors.push(`${blockWhere}: cada bloco é um objeto { }.`);
      const body = typeof rawBlock.body === 'string' ? rawBlock.body : '';
      const title = text_(rawBlock.title);
      if (!body.trim() && !title)
        return errors.push(`${blockWhere}: bloco sem "title" e sem "body".`);
      if (knownTitles.has(key(title ?? ''))) {
        skippedBlocks += 1;
        return;
      }
      knownTitles.add(key(title ?? ''));
      blocks.push({
        id: crypto.randomUUID(),
        title,
        body_md: body,
        visibility: visibilityOf(rawBlock.visibility, blockWhere),
      });
    });

    plannedByKey.set(key(name), {
      id: match?.id ?? crypto.randomUUID(),
      isNew: !match,
      type: match?.type ?? type,
      name: match?.name ?? name,
      summary: text_(raw.summary),
      tags: Array.isArray(raw.tags)
        ? raw.tags.filter((t): t is string => typeof t === 'string')
        : [],
      visibility: visibilityOf(raw.visibility, where),
      blocks,
      skippedBlocks,
    });
  });

  // Links may point at cards in this JSON or already in the campaign
  const resolve = (name: unknown) => {
    const k = key(String(name ?? ''));
    const card = plannedByKey.get(k) ?? existingByKey.get(k);
    return card ? { id: card.id, name: card.name } : null;
  };
  const linkKey = (fromId: string, toId: string, label: string) =>
    `${fromId}|${toId}|${key(label)}`;
  const knownLinks = new Set(existing.links.map((l) => linkKey(l.from_id, l.to_id, l.label)));
  let skippedLinks = 0;
  const links: PlannedLink[] = [];

  if (data.links !== undefined && !Array.isArray(data.links)) {
    errors.push('"links" deve ser uma lista.');
  }
  (Array.isArray(data.links) ? data.links : []).forEach((raw, i) => {
    const where = `links[${i}]`;
    if (!isObject(raw)) return errors.push(`${where}: cada relação é um objeto { }.`);
    const label = text_(raw.label);
    const from = resolve(raw.from);
    const to = resolve(raw.to);
    if (!label) return errors.push(`${where}: falta o "label", por exemplo "conhece".`);
    if (!from)
      return errors.push(
        `${where}: card "${String(raw.from)}" não existe nem no JSON nem na campanha.`,
      );
    if (!to)
      return errors.push(
        `${where}: card "${String(raw.to)}" não existe nem no JSON nem na campanha.`,
      );
    if (from.id === to.id) return errors.push(`${where}: um card não se relaciona com ele mesmo.`);
    const k = linkKey(from.id, to.id, label);
    if (knownLinks.has(k)) {
      skippedLinks += 1;
      return;
    }
    knownLinks.add(k);
    links.push({
      id: crypto.randomUUID(),
      fromId: from.id,
      toId: to.id,
      fromName: from.name,
      toName: to.name,
      label,
      visibility: visibilityOf(raw.visibility, where),
    });
  });

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, plan: { cards: [...plannedByKey.values()], links, skippedLinks, warnings } };
}
