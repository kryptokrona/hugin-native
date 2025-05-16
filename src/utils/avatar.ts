import Identicon, { IdenticonOptions } from 'identicon.js';
import {
  ImageLibraryOptions,
  launchImageLibrary,
} from 'react-native-image-picker';

import { Peers } from 'lib/connections';
import { useGlobalStore } from '../services/zustand';
import ImageResizer from 'react-native-image-resizer';
import { getUserAvatar } from '../services/bare/sqlite';


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
  const store = useGlobalStore.getState();

  // 1. Check roomUsers first
  const found = Object.values(store.roomUsers)
    .flat()
    .find((a) => a.address === hash && a.avatar?.length !== 0);

  if (found) {
    return found.avatar!;
  }

  // 2. Check avatars cache
  const cachedAvatar = store.avatars[hash];
  if (cachedAvatar) {
    return cachedAvatar;
  }

  // 3. Trigger async lookup without awaiting (no rerender issues)
  (async () => {
    const savedAvatar = await getUserAvatar(hash);
    if (savedAvatar) {
      useGlobalStore.getState().setAvatar(hash, savedAvatar);
      return savedAvatar;

    }
  })();

  // 4. Fallback to identicon
  if (!hash || hash.length < 15) {
    hash =
      'SEKReYanL2qEQF2HA8tu9wTpKBqoCA8TNb2mNRL5ZDyeFpxsoGNgBto3s3KJtt5PPrRH36tF7DBEJdjUn5v8eaESN2T5DPgRLVY';
  }

  if (big) size = 200;

  const rgb = intToRGB(hashCode(hash));
  const options: IdenticonOptions = {
    background: [
      Math.floor(rgb.red / 10),
      Math.floor(rgb.green / 10),
      Math.floor(rgb.blue / 10),
      0,
    ],
    foreground: [rgb.red, rgb.green, rgb.blue, 255],
    format,
    margin: 0.2,
    size,
  };

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
    includeBase64: false, // base64 will be retrieved after resize
    mediaType: 'photo',
    quality: 1,
  };

  const result = await launchImageLibrary(options);
  const uri = result.assets?.[0]?.uri;

  if (!uri) return null;

  try {
    const resized = await ImageResizer.createResizedImage(
      uri,
      64,
      64,
      'PNG',
      100,
      0,
      undefined,
      false,
      {
        mode: 'contain',
      }
    );

    // Read base64 from the resized image
    const base64 = await fetch(resized.uri)
      .then(res => res.blob())
      .then(blob => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }));

    if (base64.length > 273000) {
      return { error: 'maxAvatarSize' };
    }

    return { base64 };
  } catch (error) {
    console.error('Image resize failed:', error);
    return { error: 'resizeFailed' };
  }
};
