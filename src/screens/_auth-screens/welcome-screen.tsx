import { ScreenLayout, TextButton, TextField, XKRLogo } from '@/components';
import { StyleSheet, View } from 'react-native';

import { AuthScreens } from '@/config';
import { AuthStackNavigationType } from '@/types';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '@/services';
import { useTranslation } from 'react-i18next';

interface Props {}

export const WelcomeScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationType>();
  const theme = useThemeStore((state) => state.theme);

  const createAccount = () => {
    navigation.push(AuthScreens.CreateAccountScreen);
  };

  const restoreAccount = () => {
    navigation.push(AuthScreens.RestoreAccountScreen);
  };

  return (
    <ScreenLayout>
      <View style={Styles.container}>
        <XKRLogo />
        <TextField
          size="large"
          style={{
            color: theme.foreground,
            marginBottom: 40,
            textAlign: 'center',
          }}>
          {t('welcomeToHugin')}
        </TextField>
        <TextButton onPress={createAccount}>{'createAccount'}</TextButton>
        <TextButton onPress={restoreAccount}>{'restoreAccount'}</TextButton>
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
