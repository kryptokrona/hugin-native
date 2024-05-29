import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Clipboard, // TODO FIX SHIT
} from 'react-native';

import { toastPopUp, useGlobalStore } from '@/services';

interface CopyButtonProps {
  data: string;
  name: string;
  style?: object;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  data,
  name,
  style,
}) => {
  const theme = useGlobalStore((state) => state.theme);

  const handleCopy = () => {
    Clipboard.setString(data);
    toastPopUp(`${name} copied`);
  };

  return (
    <View style={[styles.button, style, { borderColor: theme.border }]}>
      <TouchableOpacity onPress={handleCopy}>
        {/* TODO i18n copy */}
        <Text style={[styles.text, { color: theme.primary }]}>Copy</Text>
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
