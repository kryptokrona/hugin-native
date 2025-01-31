import { BaseToast, ErrorToast, ToastProps } from 'react-native-toast-message';

import { Theme } from '@/types';

export const getToastConfig = (theme: Theme) => {
  return {
    error: (props: ToastProps) => (
      <ErrorToast
        {...props}
        style={{
          backgroundColor: theme.destructiveForeground,
          borderLeftColor: theme.destructive,
        }}
        text1Style={{
          color: theme.primary,
          fontFamily: 'Montserrat-Medium',
          fontSize: 16,
        }}
        text2Style={{
          color: theme.primary,
          fontFamily: 'Montserrat-Medium',
          fontSize: 14,
        }}
      />
    ),

    success: (props: ToastProps) => (
      <BaseToast
        {...props}
        style={{
          backgroundColor: theme.background,
          borderLeftColor: theme.primary,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          color: theme.primary,
          fontFamily: 'Montserrat-Medium',
          fontSize: 16,
        }}
      />
    ),
    /*
    Custom toast example:
  */
    // tomatoToast: ({ text1, props }) => (
    //   <View style={{ height: 60, width: '100%', backgroundColor: 'tomato' }}>
    //     <Text>{text1}</Text>
    //     <Text>{props.uuid}</Text>
    //   </View>
    // ),}
  };
};
