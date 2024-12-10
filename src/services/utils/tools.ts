export function toHex(str: string) {
  let hex = '';
  try {
    hex = unescape(encodeURIComponent(str))
      .split('')
      .map(function (v) {
        return v.charCodeAt(0).toString(16);
      })
      .join('');
  } catch (e) {
    hex = str;
    //console.log('invalid text input: ' + str)
  }
  return hex;
}
