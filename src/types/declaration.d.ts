declare module '*.svg' {
  import React from 'react';

  // import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

declare module 'int-encoder' {
  interface Encoder {
    encode: (input: number) => string;
    decode: (input: string) => number;
  }

  const encoder: Encoder;
  export default encoder;
}
