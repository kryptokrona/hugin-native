import Identicon, { IdenticonOptions } from 'identicon.js';

function hashCode(str: string) {
  let hash = 0;
  if (str.length === 0) {
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
  // Displays a fixed identicon until user adds new contact address in the input field
  if (hash?.length < 15) {
    hash =
      'SEKReYanL2qEQF2HA8tu9wTpKBqoCA8TNb2mNRL5ZDyeFpxsoGNgBto3s3KJtt5PPrRH36tF7DBEJdjUn5v8eaESN2T5DPgRLVY';
  }

  if (big) {
    size = 200;
  }

  // Get custom color scheme based on address
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
  return 'data:image/png;base64,' + new Identicon(hash, options).toString();
}
