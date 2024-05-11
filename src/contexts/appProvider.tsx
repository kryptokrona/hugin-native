import { GlobalProvider } from './global-provider';
import { Colors } from '../styles';

import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';

// import ErrorBoundary from '../components/ErrorBoundary';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <SafeAreaView style={styles.safeAreaView}>
      <StatusBar
        backgroundColor={Colors.app.background}
        barStyle="dark-content"
      />
      <GlobalProvider>{children}</GlobalProvider>
      {/* <NetworkNotification />
        <PermissionsNotification /> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaView: {
    backgroundColor: 'white',
  },
});
