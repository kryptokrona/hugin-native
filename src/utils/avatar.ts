import Identicon, { IdenticonOptions } from 'identicon.js';
import {
  ImageLibraryOptions,
  launchImageLibrary,
} from 'react-native-image-picker';

import { Peers } from 'lib/connections';
import Toast from 'react-native-toast-message';
import { t } from 'i18next';

function hashCode(str: string) {
  let hash = 0;
  if (!str || str.length === 0) {
    return hash;
  }
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  // Old code scaled the hash
  hash = Math.abs(hash) * 0.007812499538;
  return Math.floor(hash);
}

function intToRGB(int: number) {
  if (typeof int !== 'number') {
    throw new Error('intToRGB: Expected a number');
  }
  if (Math.floor(int) !== int) {
    throw new Error('intToRGB: Expected an integer');
  }
  if (int < 0 || int > 16777215) {
    throw new Error('intToRGB: Expected an integer between 0 and 16777215');
  }

  const red = int >> 16;
  const green = (int - (red << 16)) >> 8;
  const blue = int - (red << 16) - (green << 8);

  return {
    blue: blue,
    green: green,
    red: red,
  };
}

export function getAvatar(
  hash: string,
  size = 40,
  format: 'png' | 'svg' = 'png',
  big = false,
) {
  const found = Peers.active().find(
    (a) => a.address === hash && a.avatar?.length !== 0,
  );
  if (found) {
    return found.avatar;
  }
  // Displays a fixed identicon until user adds new contact address in the input field
  if (hash?.length < 15) {
    hash =
      'SEKReYanL2qEQF2HA8tu9wTpKBqoCA8TNb2mNRL5ZDyeFpxsoGNgBto3s3KJtt5PPrRH36tF7DBEJdjUn5v8eaESN2T5DPgRLVY';
  }

  if (big) {
    size = 200;
  }

  const rgb = intToRGB(hashCode(hash));

  // Options for avatar
  const options: IdenticonOptions = {
    // rgba black
    background: [
      Math.floor(rgb.red / 10),
      Math.floor(rgb.green / 10),
      Math.floor(rgb.blue / 10),
      0,
    ],
    foreground: [rgb.red, rgb.green, rgb.blue, 255],
    format: format,
    margin: 0.2,
    size, // use SVG instead of PNG
  };

  // create a base64 encoded PNG
  return new Identicon(hash, options).toString();
}

const generateRandomHash = (length: number): string => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let hash = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    hash += characters[randomIndex];
  }
  return hash;
};

export const createAvatar = () => {
  const hash = generateRandomHash(64);
  return getAvatar(hash);
};

export const pickAvatar = async () => {
  const options: ImageLibraryOptions = {
    includeBase64: true,
    mediaType: 'photo',
    quality: 1,
  };
  const result = await launchImageLibrary(options);
  const base64 = result.assets?.[0].base64;
  if (base64 && base64.length > 273000) {
    Toast.show({
      text1: t('maxAvatarSize'),
      type: 'error',
    });
    return null;
  }
  return base64 ?? null;
};
