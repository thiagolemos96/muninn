import { create } from 'zustand';
import type { EntityType } from '../cards/entityTypes.ts';

// Screen state only. Anything that comes from the database lives in TanStack Query.
type UiState = {
  // DM preview of the Grimório: hides 'dm' rows on screen (RLS still decides what is fetched)
  viewAsPlayer: boolean;
  typeFilter: EntityType | null;
  toggleViewAsPlayer: () => void;
  setTypeFilter: (type: EntityType | null) => void;
};

export const useUiStore = create<UiState>()((set) => ({
  viewAsPlayer: false,
  typeFilter: null,
  toggleViewAsPlayer: () => set((state) => ({ viewAsPlayer: !state.viewAsPlayer })),
  setTypeFilter: (type) => set({ typeFilter: type }),
}));
