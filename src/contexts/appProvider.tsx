import { SafeAreaView, StatusBar } from 'react-native';

import { useGlobalStore } from '@/services';

// import ErrorBoundary from '../components/ErrorBoundary';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { theme } = useGlobalStore();
  const backgroundColor = theme.background;
  const barStyle = theme.mode === 'light' ? 'dark-content' : 'light-content';

  return (
    <SafeAreaView style={{ backgroundColor, flex: 1 }}>
      <StatusBar backgroundColor={backgroundColor} barStyle={barStyle} />
      {children}
      {/* <NetworkNotification />
        <PermissionsNotification /> */}
    </SafeAreaView>
  );
};
