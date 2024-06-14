export const getColorFromHash = (hash: string): string => {
  let hashValue = 0;
  for (let i = 0; i < hash.length; i++) {
    hashValue = hash.charCodeAt(i) + ((hashValue << 5) - hashValue);
  }

  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hashValue >> (i * 8)) & 0xff;
    color += ('00' + value.toString(16)).slice(-2);
  }

  return color;
};
