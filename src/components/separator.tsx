import React from 'react';

import { StyleSheet, View } from 'react-native';

export const Separator = () => {
  
  return <View style={styles.separatorline} />;

}

const styles = StyleSheet.create({
  separatorline: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)', // Separator style
  }
});