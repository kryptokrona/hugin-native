import { SafeAreaView } from 'react-native';

import { useGlobalStore } from '@/services';

// import ErrorBoundary from '../components/ErrorBoundary';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // console.log('useGlobalStore:', useGlobalStore);
  const theme = useGlobalStore((state) => state.theme);
  console.log({ theme });
  // const backgroundColor = theme.background;
  // const barStyle = theme.mode === 'light' ? 'dark-content' : 'light-content';

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* <StatusBar backgroundColor={backgroundColor} barStyle={barStyle} /> */}
      {children}
      {/* <NetworkNotification />
        <PermissionsNotification /> */}
    </SafeAreaView>
  );
};
