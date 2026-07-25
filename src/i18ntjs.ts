import en from './i18n/translations/en.json';
import fr from './i18n/translations/fr.json';

import i18next from 'i18next';
import RNLanguageDetector from '@os-team/i18next-react-native-language-detector';
import { initReactI18next } from 'react-i18next';

i18next
  .use(RNLanguageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    debug: true,
    fallbackLng: 'en',
    resources: {
      en: {
        translation: en,
      },
      fr: {
        translation: fr,
      },
    },
  });

export default i18next;
