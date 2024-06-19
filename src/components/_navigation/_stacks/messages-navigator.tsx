import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { MessagesScreens } from '@/config';
import { MessageScreen, MessagesScreen } from '@/screens';
import type { MessagesStackParamList } from '@/types';

import { Header } from '../header';

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export const MessagesStackNavigator = () => {
  const { t } = useTranslation();
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={MessagesScreens.MessagesScreen}
        component={MessagesScreen}
        options={() => ({
          header: (_props) => <Header title={t('messagesTitle')} />,
        })}
      />
      <Stack.Screen
        name={MessagesScreens.MessageScreen}
        component={MessageScreen}
      />
    </Stack.Navigator>
  );
};
