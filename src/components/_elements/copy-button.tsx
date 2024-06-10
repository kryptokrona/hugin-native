import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Clipboard, // TODO FIX SHIT
} from 'react-native';

import { useTranslation } from 'react-i18next';

import { toastPopUp, useGlobalStore } from '@/services';

interface CopyButtonProps {
  data: string;
  style?: object;
  text: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  data,
  style,
  text,
}) => {
  const { t } = useTranslation();
  const theme = useGlobalStore((state) => state.theme);

  const handleCopy = () => {
    Clipboard.setString(data);
    toastPopUp(`${t('copied')}`);
  };

  return (
    <View style={[styles.button, style, { borderColor: theme.border }]}>
      <TouchableOpacity onPress={handleCopy}>
        <Text style={[styles.text, { color: theme.primary }]}>{text}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 8,
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
