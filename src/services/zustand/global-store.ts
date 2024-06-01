import { create } from 'zustand';

import { Themes } from '@/styles';
import type { Group, Theme } from '@/types';

type GlobalStore = {
  theme: Theme;
  recommendedGroups: Group[];

  setTheme: (payload: Theme) => void;
  setRecommendedGroups: (payload: Group[]) => void;
};

export const useGlobalStore = create<GlobalStore>((set) => ({
  recommendedGroups: [],
  setRecommendedGroups(payload: Group[]) {
    set({ recommendedGroups: payload });
  },

  setTheme(payload: Theme) {
    set({ theme: payload });
  },
  theme: Themes.dark,
}));
