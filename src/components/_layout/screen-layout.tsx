import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import React from 'react';
import { useHeaderHeight } from '@react-navigation/elements';
import { useThemeStore } from '@/services';

interface Props {
  children: React.ReactNode;
  touchableWithoutFeedback?: boolean;
}

export const ScreenLayout: React.FC<Props> = ({
  children,
  touchableWithoutFeedback = true,
}) => {
  const mHeight = useHeaderHeight();
  const height = mHeight + 20;
  const behavior = Platform.OS === 'ios' ? 'padding' : 'height';
  const theme = useThemeStore((state) => state.theme);
  const backgroundColor = theme.background;

  if (!touchableWithoutFeedback) {
    return (
      <View style={[styles.screen, { backgroundColor }]}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={behavior}
          keyboardVerticalOffset={height}>
          <View style={[styles.innerView]}>{children}</View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.screen, { backgroundColor }]}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={behavior}
          keyboardVerticalOffset={height}>
          <View style={styles.innerView}>{children}</View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  innerView: {
    flexGrow: 1,
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingVertical: 4,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  screen: {
    flex: 1,
    flexGrow: 1,
  },
});
