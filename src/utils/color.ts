export const getColorFromHash = (hash: string): string => {
  let hashValue = 0;
  for (let i = 0; i < hash.length; i++) {
    hashValue = hash.charCodeAt(i) + ((hashValue << 5) - hashValue);
  }

  let color = '#';
  const rgb = [];

  for (let i = 0; i < 3; i++) {
    const value = (hashValue >> (i * 8)) & 0xff;
    rgb.push(value);
    color += ('00' + value.toString(16)).slice(-2);
  }
  const brightness = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  if (brightness < 0.7) {
    const brightenedRgb = rgb.map((component) =>
      Math.min(255, Math.floor(component + (255 - component) * 0.7)),
    );
    color = '#';
    brightenedRgb.forEach((component) => {
      color += ('00' + component.toString(16)).slice(-2);
    });
  }

  return color;
};
