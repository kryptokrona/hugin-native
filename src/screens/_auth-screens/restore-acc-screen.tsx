import {
  FlatList,
  StyleSheet,
  TextInput,
  ToastAndroid,
  View,
} from 'react-native';
import { InputField, ScreenLayout, TextButton, TextField } from '@/components';
import React, { useRef, useState } from 'react';

import { AuthScreens } from 'config/screens.ts';
import { AuthStackNavigationType } from '@/types';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '@/services';
import { useTranslation } from 'react-i18next';
import { wordlist } from '../../config/wordlist.ts';

export const RestoreAccountScreen: React.FC = () => {
  const navigation = useNavigation<AuthStackNavigationType>();
  const theme = useThemeStore((state) => state.theme);
  const { t } = useTranslation();
  const [seedWords, setSeedWords] = useState(Array(25).fill(''));
  const [validWords, setValidWords] = useState(Array(25).fill(false));
  const [step, setStep] = React.useState<number>(1);
  const [blockHeightInput, setBlockHeightInput] = useState<number>(0);
  const inputRefs = useRef<Array<React.RefObject<TextInput>>>(
    Array.from({ length: 25 }, () => React.createRef<TextInput>()),
  );

  const validateSeedWords = () => {
    return seedWords.every((word) => wordlist.includes(word));
  };

  const handleWordInput = (text: string, index: number) => {
    const updatedWords = [...seedWords];
    updatedWords[index] = text;
    setSeedWords(updatedWords);

    const updatedValidWords = [...validWords];
    updatedValidWords[index] = wordlist.includes(text);
    setValidWords(updatedValidWords);

    if (wordlist.includes(text) && index < 24) {
      inputRefs.current[index + 1]?.current?.focus();
    } else if (!text && index > 0) {
      inputRefs.current[index - 1]?.current?.focus();
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await Clipboard.getString();
      const words = clipboardText.trim().split(/\s+/);
      if (words.length === 25) {
        setSeedWords(words);
        setValidWords(words.map((word) => wordlist.includes(word)));

        words.forEach((word, index) => {
          if (inputRefs.current[index]?.current) {
            inputRefs.current[index].current.setNativeProps({ text: word });
          }
        });
        ToastAndroid.show(
          t('Seed words pasted successfully!'),
          ToastAndroid.SHORT,
        );
      } else {
        ToastAndroid.show(
          t('Invalid seed phrase length. Must be 25 words.'),
          ToastAndroid.SHORT,
        );
      }
    } catch (error) {
      ToastAndroid.show(t('Failed to read clipboard.'), ToastAndroid.SHORT);
    }
  };

  const handleSubmit = () => {
    if (validateSeedWords()) {
      setStep(2);
    } else {
      ToastAndroid.show(
        t('Please fill all seed words correctly.'),
        ToastAndroid.SHORT,
      );
    }
  };

  const goToCreate = (height: number) => {
    navigation.push(AuthScreens.CreateAccountScreen, {
      selectedValues: {
        blockHeight: height,
        seedWords,
      },
    });
  };

  function onSetBlockHeight(value: string) {
    setBlockHeightInput(Number(value));
  }

  if (step === 1) {
    return (
      <ScreenLayout>
        <TextField size="large">{t('Enter Seed Words')}</TextField>
        <View style={styles.listContainer}>
          <FlatList
            numColumns={3}
            data={seedWords}
            keyExtractor={(word: any, i) => `${word}-${i}`}
            renderItem={({ item, index }) => {
              return (
                <TextInput
                  key={index}
                  ref={inputRefs.current[index]}
                  style={[
                    {
                      backgroundColor: theme.accent,
                      borderColor: theme.accentForeground,
                      borderRadius: 5,
                      borderWidth: 1,
                      color: theme.accentForeground,
                      height: 40,
                      margin: 5,
                      textAlign: 'center',
                      width: 100,
                    },
                    validWords[index] && { borderColor: 'green' },
                  ]}
                  value={item}
                  onChangeText={(text) => handleWordInput(text, index)}
                  placeholder={`${index + 1}`}
                  placeholderTextColor="gray"
                />
              );
            }}
          />
        </View>

        <TextButton onPress={handlePaste}>{t('Paste Seed Words')}</TextButton>
        <TextButton onPress={handleSubmit}>{t('Restore account')}</TextButton>
      </ScreenLayout>
    );
  } else if (step === 2) {
    return (
      <ScreenLayout>
        <View>
          <InputField
            label={t('Enter block height')}
            value={blockHeightInput}
            onChange={onSetBlockHeight}
            keyboardType="number-pad"
          />
          <View>
            <TextButton onPress={() => goToCreate(blockHeightInput)}>
              {t('Choose selected blockheight')}
            </TextButton>
            <TextButton type="secondary" onPress={() => goToCreate(0)}>
              {t("I don't know")}
            </TextButton>
          </View>
        </View>
      </ScreenLayout>
    );
  }
};

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
});
