import React from 'react';

import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { toastPopUp, useGlobalStore } from '@/services';

interface CopyButtonProps {
  data: string;
  name: string;
  style?: object;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  //   data,
  name,
  style,
}) => {
  const theme = useGlobalStore((state) => state.theme);

  const handleCopy = () => {
    // Clipboard.setString(data); // TODO when lib is updated tow ork with RN 0.74
    toastPopUp(`${name} copied`);
  };

  return (
    <View style={[styles.container, style, { borderColor: theme.border }]}>
      <TouchableOpacity onPress={handleCopy}>
        <Text style={[styles.buttonText, { color: theme.primary }]}>Copy</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonText: {
    marginTop: -3,
    textDecorationLine: 'none',
  },
  container: {
    alignItems: 'flex-start',
    borderRadius: 3,
    borderWidth: 1,
    marginTop: 10,
    paddingTop: 0,
  },
});
