import React from 'react';

import { Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useThemeStore } from '@/services';

import { CopyButton } from './_elements';
import { Card } from './_layout';

interface SeedComponentProps {
  seed?: string | null;
}

export const SeedComponent: React.FC<SeedComponentProps> = ({ seed }) => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);

  return (
    seed && (
      <View>
        <Card>
          <Text style={{ color: theme.primary }}>{seed}</Text>
        </Card>
        <CopyButton data={seed} text={t('copy')} />
      </View>
    )
  );
};

// const styles = StyleSheet.create({
//   container: {
//     borderWidth: 1,
//     flex: 1,
//     marginTop: 10,
//     padding: 10,
//   },
// });
