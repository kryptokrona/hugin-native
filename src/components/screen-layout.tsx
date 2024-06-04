import React from 'react';

import { StyleSheet, View } from 'react-native';

import { useGlobalStore } from '@/services';

interface Props {
  children: React.ReactNode;
}

export const ScreenLayout: React.FC<Props> = ({ children }) => {
  const isArray = Array.isArray(children);
  const theme = useGlobalStore((state) => state.theme);
  const backgroundColor = theme.background;

  function itemMapper(item: React.ReactNode, index: number) {
    return (
      <View style={styles.divider} key={index}>
        {item}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {isArray ? children.map(itemMapper) : children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  divider: {
    marginBottom: 12,
  },
});
