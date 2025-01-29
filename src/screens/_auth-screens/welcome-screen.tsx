import { useLayoutEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { ScreenLayout, TextButton, TextField, XKRLogo } from '@/components';
import { AuthScreens } from '@/config';
import { useThemeStore } from '@/services';
import { AuthStackNavigationType } from '@/types';

interface Props {}

export const WelcomeScreen: React.FC<Props> = () => {
  const navigation = useNavigation<AuthStackNavigationType>();
  const theme = useThemeStore((state) => state.theme);

  const createAccount = () => {
    navigation.push(AuthScreens.CreateAccountScreen);
  };

  const restoreAccount = () => {
    navigation.push(AuthScreens.RestoreAccountScreen);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => <></>,
    });
  }, []);

  // TODO fix translation
  return (
    <ScreenLayout>
      <View style={Styles.container}>
        <XKRLogo />
        <TextField
          size="large"
          style={{ color: theme.foreground, marginBottom: 40, textAlign: 'center' }}>
          Welcome to Hugin Messenger!
        </TextField>
        <TextButton onPress={createAccount}>{'Create new account'}</TextButton>
        <TextButton onPress={restoreAccount}>{'Restore account'}</TextButton>
      </View>
    </ScreenLayout>
  );
};

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 20,
  },
});
