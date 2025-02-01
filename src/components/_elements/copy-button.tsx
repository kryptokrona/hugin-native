import Clipboard from '@react-native-clipboard/clipboard';
import { CustomIcon } from './custom-icon';
import type { ElementType } from '@/types';
import { TextButton } from './text-button';
import { useThemeStore } from '@/services';

interface CopyButtonProps {
  data: string;
  text: string;
  type?: ElementType;
  small?: boolean;
  onPress?: () => void;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  data,
  text,
  type = 'primary',
  small = false,
  onPress,
}) => {
  // const { t } = useTranslation();
  // const toast = useToast();
  const theme = useThemeStore((state) => state.theme);
  const iconColor =
    type === 'primary' ? theme.primaryForeground : theme.secondaryForeground;

  const handleCopy = () => {
    Clipboard.setString(data);
    onPress?.();
    // toast.show(`${t('copied')}`);
    // toastPopUp(`${t('copied')}`);
  };

  return (
    <TextButton
      small={small}
      type={type}
      onPress={handleCopy}
      icon={
        <CustomIcon
          name="copy-sharp"
          type="IO"
          color={iconColor}
          size={small ? 16 : 24}
        />
      }>
      {text}
    </TextButton>
  );
};
