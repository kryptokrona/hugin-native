import React from 'react';

import { View, StyleSheet } from 'react-native';

import _ from 'lodash';

import { useGlobalStore } from '@/services';

import { CopyButton, TextField } from './_elements';

interface SeedComponentProps {
  seed: string;
}

export const SeedComponent: React.FC<SeedComponentProps> = ({
  seed,
  ...props
}) => {
  const theme = useGlobalStore((state) => state.theme);

  const split = seed.split(' ');
  const lines = _.chunk(split, 5);

  return (
    <View>
      <View style={[styles.container, { borderColor: theme.border }]}>
        {lines.map((line, index) => (
          <TextField key={index} {...props}>
            {line.join(' ')}
          </TextField>
        ))}
      </View>
      <CopyButton data={seed} name="Seed" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    marginTop: 10,
    padding: 10,
  },
});
