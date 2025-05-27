import { Avatar, CustomIcon, TextButton, TextField, Unreads } from './_elements';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { getAvatar, prettyPrintDate } from '@/utils';
import { useGlobalStore, useThemeStore, Wallet } from '@/services';
import { t } from 'i18next';
import { useEffect, useRef, useState } from 'react';
import { GroupOnlineIndicator } from './group-online-indicator';
import { Styles } from '@/styles';

interface Props {
  name: string;
  roomKey?: string;
  address?: string;
  message?: string;
  timestamp?: number;
  unreads?: number;
  onPress: (key: string, name: string) => void;
  onLongPress?: () => void;
  suggested?: boolean;
  alreadyInRoom?: boolean;
}

export const PreviewItem: React.FC<Props> = ({
  name,
  roomKey,
  address,
  message,
  unreads = 0,
  onPress,
  onLongPress,
  suggested = false,
  alreadyInRoom = true,
  timestamp = undefined
}) => {
  const mRoomKey: string = roomKey ? roomKey : (address as string);
  const theme = useThemeStore((state) => state.theme);
  const isNew = false; // Can be used for future logic
  const borderColor = isNew ? theme.foreground : theme.border;
  const color = theme.background;
  const foreground = theme.foreground;
  const allRoomUsers = useGlobalStore((state) => state.roomUsers);
  const [online, setOnline] = useState(false);

  const dateString = prettyPrintDate(timestamp ?? 0);

  const keyRef = useRef('null');
  
    useEffect(() => {
      if (roomKey) return;
      if (keyRef.current != 'null') return;
      const deriveKey = async () => {
        const derivedKey = await Wallet.key_derivation_hash(address);
        keyRef.current = derivedKey;
      };
      deriveKey();
    }, [mRoomKey]); // Run only when `roomKey` changes


    useEffect(() => {
      console.log('Roomusers update!');
      if (roomKey) {
        setOnline(allRoomUsers[mRoomKey]?.length > 1);
        return;
      }
      console.log('allRoomUsers[keyRef.current]', allRoomUsers[keyRef?.current]?.length)
      setOnline(allRoomUsers[keyRef.current]?.length > 1);
    }, [allRoomUsers]); // Run only when `roomKey` changes


  function handlePress() {
    onPress(mRoomKey, name);
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={onLongPress}
      style={[
        styles.container,
        { borderColor, borderBottomWidth: suggested ? 0 : 1 },
      ]}>
      <View style={styles.avatarContainer}>
        <Unreads unreads={unreads} />
        {mRoomKey?.length > 15 && (
          <>
          <Avatar onPress={handlePress} size={suggested ? 25 : 50} address={mRoomKey} base64={getAvatar(mRoomKey)} />
          {!suggested &&

            <View style={{position: 'absolute', right: 0, top: 0}}>
            <CustomIcon
            name={'lens'}
            size={10}
            type={'MI'}
            color={`${online ? 'green' : 'grey'}`}
            />
            </View>
          }
          </>
        )}
      </View>

      <View style={[styles.content, suggested && styles.centeredContent]}>
        <TextField bold={isNew} maxLength={22} size={suggested ? "small" : "large"}>
          {name}
        </TextField>
        {!suggested &&
          <TextField bold={isNew} maxLength={65} size="small">
            {message}
          </TextField>
        }
        {timestamp &&
        <View style={{ position: 'absolute', right: 0}}>
          <TextField style={{color: theme.foreground}} bold={isNew} maxLength={65} size="xsmall">
            {dateString}
          </TextField>
        </View>
        }
        {suggested && !alreadyInRoom && 
          <TouchableOpacity onPress={handlePress} style={[styles.joinButton, {backgroundColor: theme.primary}]}>
            <TextField bold size="xsmall" color={color}>
            {t('joinRoom')}
            </TextField>
          </TouchableOpacity>
        }
        {suggested && alreadyInRoom &&
          <GroupOnlineIndicator roomKey={roomKey} onPress={() => {}} />
        }
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    position: 'relative',
  },
  container: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  centeredContent: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  joinButton: {
    borderRadius: 5,
    paddingHorizontal: 4
  }
});
