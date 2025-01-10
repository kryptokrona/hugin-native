import { Text } from 'react-native';

import { ScreenLayout, TextButton } from '@/components';
import { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { AuthStackNavigationType } from '@/types';
import { useTranslation } from 'react-i18next';

interface Props {}

export const WelcomeScreen: React.FC<Props> = () => {

  const navigation = useNavigation<AuthStackNavigationType>();
  const { t } = useTranslation();

  const createAccount = () => {
    navigation.push('CreateAccountScreen');
  }

  const restoreAccount = () => {
    navigation.push('RestoreAccountScreen');
  }

    useLayoutEffect(() => {
      navigation.setOptions({
        header: () => <></>,
      });
    }, []);

  return (
    <ScreenLayout>
      <Text style={{'color': 'white'}}>Welcome to Hugin Messenger!</Text>
      <TextButton
        onPress={createAccount}
        >
        {'Create new account'}
      </TextButton>
      <TextButton
        onPress={restoreAccount}
        >
        {'Restore account'}
      </TextButton>
    </ScreenLayout>
  );
};
