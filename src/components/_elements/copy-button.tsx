import Clipboard from '@react-native-clipboard/clipboard';

import { useGlobalStore } from '@/services';
import { ElementType } from '@/types';

import { CustomIcon } from './custom-icon';
import { TextButton } from './text-button';

interface CopyButtonProps {
  data: string;
  text: string;
  type?: ElementType;
  small?: boolean;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  data,
  text,
  type = 'primary',
  small = false,
}) => {
  // const { t } = useTranslation();
  // const toast = useToast();
  const theme = useGlobalStore((state) => state.theme);
  const iconColor = type === 'primary' ? theme.inverted : theme.primary;

  const handleCopy = () => {
    Clipboard.setString(data);
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
