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
    flexDirection: 'column',
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  divider: {
    marginBottom: 12,
  },
});
