export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

//Checks for messages that only coinatins emojis.
export const containsOnlyEmojis = (text: string) => {
  if (!isLatin(text)) {
    return false;
  }
  const onlyEmojis = text.replace(new RegExp('[\u0000-\u1eeff]', 'g'), '');
  const visibleChars = text.replace(new RegExp('[\n\rs]+|( )+', 'g'), '');
  return onlyEmojis.length === visibleChars.length;
};

export const isLatin = (text: string) => {
  const REGEX_CHINESE =
    /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/;
  const isChinese = text.match(REGEX_CHINESE);
  if (isChinese) {
    return false;
  }
  const REGEX_JAPAN = /[\u3040-\u30FF\u31F0-\u31FF\uFF00-\uFFEF]/;
  const isJapanese = text.match(REGEX_JAPAN);
  if (isJapanese) {
    return false;
  }
  const REGEX_KOREA = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/;
  const isKorean = text.match(REGEX_KOREA);
  if (isKorean) {
    return false;
  }
  return true;
};

export const formatHashString = (hash: string) => {
  return hash.substring(0, 8) + '...' + hash.substring(91, 99);
};
