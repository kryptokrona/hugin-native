// import ErrorBoundary from '../components/ErrorBoundary';

import { useEffect } from 'react';

import { SafeAreaView } from 'react-native';

import { init } from '@/services';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  useEffect(() => {
    init();
  }, []);

  return <SafeAreaView style={{ flex: 1 }}>{children}</SafeAreaView>;
};
