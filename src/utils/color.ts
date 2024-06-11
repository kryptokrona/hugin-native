export const getColorFromHash = (hash: string): string => {
  const shortHash = hash.slice(0, 6);

  let color = '#';
  for (let i = 0; i < shortHash.length; i++) {
    const value = shortHash.charCodeAt(i);
    // Map the character value to a range between 64 and 192 to avoid very dark or very light colors
    const adjustedValue = 64 + (value % 128);
    color += ('0' + adjustedValue.toString(16)).slice(-2);
  }

  return color.slice(0, 7);
};
