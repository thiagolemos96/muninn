import type { Enums } from '../../lib/database.types.ts';

/**
 * Text shown on the right of each block title (docs/design.md, components 4 and 5).
 *
 * visibility:     'dm' (only the DM) or 'party' (revealed to the group)
 * revealedIn:     sessions.id where it was revealed, or null
 * sessionNumbers: sessions.id -> sessions.number for this campaign
 *
 * Cases to decide:
 * - 'dm' block: the design says "Só o mestre".
 * - 'party' block whose session is known: the design says "Grupo, desde a sessão N".
 * - 'party' block with revealedIn = null: revealed before the app existed, or its
 *   session was deleted (the FK is ON DELETE SET NULL). What should the group read?
 * - 'party' block whose revealedIn is not in sessionNumbers (map still loading).
 */
export function visibilityLabel(
  visibility: Enums<'visibility'>,
  _revealedIn: string | null,
  _sessionNumbers: ReadonlyMap<string, number>,
): string {
  // TODO(Thiago): placeholder until you write the real rule (5 to 10 lines)
  return visibility === 'dm' ? 'Só o mestre' : 'Grupo';
}
