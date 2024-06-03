import { create } from 'zustand';

import { Themes } from '@/styles';
import type { Theme } from '@/types';

type GlobalStore = {
  theme: Theme;

  setTheme: (payload: Theme) => void;
};

export const useGlobalStore = create<GlobalStore>((set) => ({
  setTheme(payload: Theme) {
    set({ theme: payload });
  },
  theme: Themes.dark,
}));
