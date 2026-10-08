import type { Enums } from '../../lib/database.types.ts';

export type EntityType = Enums<'entity_type'>;

// Fixed order: it is also the order of the 5-segment bar in the card header
export const ENTITY_TYPES: readonly EntityType[] = [
  'npc',
  'location',
  'faction',
  'item',
  'document',
];

export const TYPE_LABEL: Record<EntityType, string> = {
  npc: 'NPC',
  location: 'Local',
  faction: 'Facção',
  item: 'Item',
  document: 'Documento',
};
