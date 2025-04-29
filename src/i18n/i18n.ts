import RNLanguageDetector from '@os-team/i18next-react-native-language-detector';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import ben from './translations/ben.json';
import bho from './translations/bho.json';
import de from './translations/de.json';
import en from './translations/en.json';
import fi from './translations/fi.json';
import fr from './translations/fr.json';
import gu from './translations/gu.json';
import hi from './translations/hi.json';
import id from './translations/id.json';
import mai from './translations/mai.json';
import mr from './translations/mr.json';
import no from './translations/no.json';
import ph from './translations/ph.json';
import pt from './translations/pt.json';
import ru from './translations/ru.json';
import sv from './translations/sv.json';
import te from './translations/te.json';
import tr from './translations/tr.json';
import uk from './translations/uk.json';
import ur from './translations/ur.json';
import zh from './translations/zh.json';
import es from './translations/es.json';
import it from './translations/it.json';

i18next
  // .use(languageDetector)
  // .use(RNLanguageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    debug: true,
    fallbackLng: 'en',
    resources: {
      ben: {
        translation: ben,
      },
      bho: {
        translation: bho,
      },
      de: {
        translation: de,
      },
      en: {
        translation: en,
      },
      fi: {
        translation: fi,
      },
      fr: {
        translation: fr,
      },
      gu: {
        translation: gu,
      },
      hi: {
        translation: hi,
      },
      id: {
        translation: id,
      },
      mai: {
        translation: mai,
      },
      mr: {
        translation: mr,
      },
      nb: {
        translation: no,
      },
      no: {
        translation: no,
      },
      ph: {
        translation: ph,
      },
      pt: {
        translation: pt,
      },
      ru: {
        translation: ru,
      },
      sv: {
        translation: sv,
      },
      te: {
        translation: te,
      },
      tr: {
        translation: tr,
      },
      uk: {
        translation: uk,
      },
      ur: {
        translation: ur,
      },
      zh: {
        translation: zh,
      },
      es: {
        translation: es,
      },
      it: {
        translation: it,
      },
    },
  });

export default i18next;
