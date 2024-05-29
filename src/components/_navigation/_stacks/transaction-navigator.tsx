import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MainScreen } from '@/screens';
import { TransactionsScreens, TransactionsStackParamList } from '@/types';

const Stack = createNativeStackNavigator<TransactionsStackParamList>();

export const TransactionsStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={TransactionsScreens.TransactionsScreen}
        component={MainScreen}
      />
      <Stack.Screen
        name={TransactionsScreens.TransactionDetailsScreen}
        component={MainScreen}
      />
    </Stack.Navigator>
  );
};
