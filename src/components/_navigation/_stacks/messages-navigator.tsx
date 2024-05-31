import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MessageScreen, MessagesScreen } from '@/screens';
import { MessagesScreens, type MessagesStackParamList } from '@/types';

import { Header } from '../header';

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export const MessagesStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={MessagesScreens.MessagesScreen}
        component={MessagesScreen}
        options={() => ({
          header: (_props) => <Header title={'Messages'} />,
        })}
      />
      <Stack.Screen
        name={MessagesScreens.MessageScreen}
        component={MessageScreen}
      />
    </Stack.Navigator>
  );
};
