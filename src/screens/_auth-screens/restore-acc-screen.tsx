import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ToastAndroid,
  ScrollView,
  Clipboard,
} from 'react-native';
import { Header, ScreenLayout, TextButton, InputField } from '@/components';
import { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { AuthStackNavigationType } from '@/types';
import { useTranslation } from 'react-i18next';
import { wordlist } from '../../config/wordlist.ts';

export const RestoreAccountScreen: React.FC = () => {
  const navigation = useNavigation<AuthStackNavigationType>();
  const { t } = useTranslation();
  const [seedWords, setSeedWords] = useState(Array(25).fill(''));
  const [validWords, setValidWords] = useState(Array(25).fill(false));
  const [step, setStep] = React.useState<number>(1);
  const [blockHeightInput, setBlockHeightInput] = useState<number>(0);
  const inputRefs = useRef<Array<React.RefObject<TextInput>>>(Array.from({ length: 25 }, () => React.createRef<TextInput>()));

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => <Header backButton title={t('Restore account')} />,
    });
  }, [navigation, t]);

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
        ToastAndroid.show(t('Seed words pasted successfully!'), ToastAndroid.SHORT);
      } else {
        ToastAndroid.show(t('Invalid seed phrase length. Must be 25 words.'), ToastAndroid.SHORT);
      }
    } catch (error) {
      ToastAndroid.show(t('Failed to read clipboard.'), ToastAndroid.SHORT);
    }
  };

  const handleSubmit = () => {
    if (validateSeedWords()) {
      setStep(2);
    } else {
      ToastAndroid.show(t('Please fill all seed words correctly.'), ToastAndroid.SHORT);
    }
  };

  const goToCreate = (height) => {
    navigation.push('CreateAccountScreen', {
      selectedValues: {
        seedWords,
        blockHeight: height,
      },
    });
  };

  if (step === 1) {
    return (
      <ScreenLayout>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>{t('Enter Seed Words')}</Text>
          <View style={styles.grid}>
            {seedWords.map((word, index) => (
              <TextInput
                key={index}
                ref={inputRefs.current[index]}
                style={[
                  styles.input,
                  validWords[index] && { borderColor: 'green' },
                ]}
                value={word}
                onChangeText={(text) => handleWordInput(text, index)}
                placeholder={`${index + 1}`}
                placeholderTextColor="gray"
              />
            ))}
          </View>
          <TextButton onPress={handlePaste}>{t('Paste Seed Words')}</TextButton>
          <TextButton onPress={handleSubmit}>{t('Restore account')}</TextButton>
        </ScrollView>
      </ScreenLayout>
    );
  } else if (step === 2) {
    return (
      <ScreenLayout>
        <View style={styles.container}>
          <InputField
            label={t('Enter block height')}
            value={blockHeightInput}
            onChange={setBlockHeightInput}
          />
          <View>
            <TextButton onPress={() => goToCreate(blockHeightInput)}>
              {t('Choose selected blockheight')}
            </TextButton>
            <TextButton onPress={() => goToCreate(0)}>
              {t('I don\'t know')}
            </TextButton>
          </View>
        </View>
      </ScreenLayout>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  input: {
    width: 100,
    height: 40,
    borderWidth: 1,
    borderColor: 'gray',
    margin: 5,
    textAlign: 'center',
    color: 'white',
    backgroundColor: '#2c2c2c',
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
});
