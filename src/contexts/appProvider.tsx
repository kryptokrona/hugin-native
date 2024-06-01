// import ErrorBoundary from '../components/ErrorBoundary';

import { SafeAreaView } from 'react-native';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return <SafeAreaView style={{ flex: 1 }}>{children}</SafeAreaView>;
};
