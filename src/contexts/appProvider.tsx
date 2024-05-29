import { SafeAreaView } from 'react-native';

// import ErrorBoundary from '../components/ErrorBoundary';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      {children}
      {/* <NetworkNotification />
        <PermissionsNotification /> */}
    </SafeAreaView>
  );
};
