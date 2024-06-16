import React from 'react';

import { StyleSheet, View } from 'react-native';

interface Props {
  bottom?: boolean;
  children: React.ReactNode;
  row?: boolean;
}

export const Container: React.FC<Props> = ({ bottom, children, row }) => {
  return (
    <View style={[styles.container, bottom && styles.bottom]}>
      <View style={[styles.innerContainer, row && styles.row]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottom: {
    justifyContent: 'flex-end',
  },
  container: {
    alignSelf: 'stretch',
    flexGrow: 1,
  },
  innerContainer: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
});
