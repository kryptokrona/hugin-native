export const getColorFromHash = (hash: string): string => {
  let hashValue = 0;
  for (let i = 0; i < hash.length; i++) {
    hashValue = hash.charCodeAt(i) + ((hashValue << 5) - hashValue);
  }

  const hue = Math.abs(hashValue % 360);
  const saturation = 60 + (Math.abs(hashValue) % 30);
  const lightness = 35 + (Math.abs(hashValue) % 30);

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};
