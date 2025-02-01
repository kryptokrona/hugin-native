import { CopyButton, TextField } from './_elements';

import { Card } from './_layout';
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

interface SeedComponentProps {
  seed?: string | null;
}

export const SeedComponent: React.FC<SeedComponentProps> = ({ seed }) => {
  const { t } = useTranslation();

  return (
    seed && (
      <View>
        <Card>
          <TextField>{seed}</TextField>
        </Card>
        <CopyButton data={seed} text={t('copy')} />
      </View>
    )
  );
};
