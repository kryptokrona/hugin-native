import { ScreenLayout, TextButton, TextField } from '@/components';
import { StyleSheet, View } from 'react-native';
import HuginLogo from '../../assets/img/hugin-bg.svg';

import { AuthScreens } from '@/config';
import { AuthStackNavigationType } from '@/types';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useThemeStore } from '@/services';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useRef } from 'react';
import { themes } from '@/styles';

interface Props {}

export const WelcomeScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationType>();
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const setShowFooterMask = useThemeStore((s) => s.setShowFooterMask);

  useFocusEffect(
    useCallback(() => {
      const originalTheme = useThemeStore.getState().theme;
      console.log('originalTheme', originalTheme)
  
      setTheme({
        ...originalTheme,
        background: '#FF816F',
      });
      setShowFooterMask(true);
  
      return () => {
        const darkTheme = themes[theme.name as keyof typeof themes].dark as Theme;
        useThemeStore.setState({ theme: darkTheme });
        setShowFooterMask(false);
      };
    }, [setTheme, setShowFooterMask]),
  );
  
  

  const createAccount = () => {
    navigation.push(AuthScreens.CreateAccountScreen);
  };

  const restoreAccount = () => {
    navigation.push(AuthScreens.RestoreAccountScreen);
  };

  return (
    <ScreenLayout style={{ backgroundColor: theme.background }}>
      <HuginLogo width={520} height={1000} style={Styles.logo} />
      <View style={Styles.container}>
        <TextField
          size="large"
          style={{
            color: theme.foreground,
            marginBottom: 40,
            textAlign: 'center',
          }}>
          {t('welcomeToHugin')}
        </TextField>
        <TextButton onPress={createAccount}>{t('createAccount')}</TextButton>
        <TextButton onPress={restoreAccount}>{t('restoreAccount')}</TextButton>
      </View>
    </ScreenLayout>
  );
};


const Styles = StyleSheet.create({
  container: {
    bottom: 0,
    flex: 1,
    padding: 20,
    alignItems: 'bottom',
    justifyContent: 'flex-end',
  },
  logo: {
    marginBottom: 30,
    position: 'absolute',
    left: 0,
    top: -20,
    width: 1000
  },
});
