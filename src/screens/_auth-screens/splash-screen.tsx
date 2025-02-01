import { StyleSheet, View } from 'react-native';

import { XKRLogo } from '@/components';

export const SplashScreen: React.FC = () => {
  return (
    <View style={[styles.screen, { backgroundColor: 'black' }]}>
      <XKRLogo />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    flexGrow: 1,
  },
});
