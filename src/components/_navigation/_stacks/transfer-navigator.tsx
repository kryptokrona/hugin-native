import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MainScreen } from '@/screens';
import { TransferScreens, TransferStackParamList } from '@/types';

const Stack = createNativeStackNavigator<TransferStackParamList>();

export const TransferStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={TransferScreens.ChoosePayeeScreen}
        component={MainScreen}
      />
      <Stack.Screen
        name={TransferScreens.ConfirmScreen}
        component={MainScreen}
      />
      <Stack.Screen
        name={TransferScreens.NewPayeeScreen}
        component={MainScreen}
      />
      <Stack.Screen
        name={TransferScreens.QrScannerScreen}
        component={MainScreen}
      />
      <Stack.Screen
        name={TransferScreens.SendTransactionScreen}
        component={MainScreen}
      />
    </Stack.Navigator>
  );
};
