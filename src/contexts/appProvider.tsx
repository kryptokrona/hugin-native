// import ErrorBoundary from '../components/ErrorBoundary';

import { useEffect } from 'react';

import { SafeAreaView } from 'react-native';

import { init, useAppStoreState } from '@/services';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const isHydrated = useAppStoreState((state) => state._hasHydrated);

  useEffect(() => {
    async function _init() {
      await init();
    }
    if (isHydrated.preferences && isHydrated.user && isHydrated.theme) {
      _init();
    }
  }, [isHydrated]);

  return <SafeAreaView style={{ flex: 1 }}>{children}</SafeAreaView>;
};
