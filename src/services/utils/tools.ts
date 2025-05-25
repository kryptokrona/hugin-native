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

export const hexToUint = (hexString: string) =>
  new Uint8Array(
    hexString.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? [],
  );

export function fromHex(hex: string) {
  let str;
  try {
    str = decodeURIComponent(hex.replace(/(..)/g, '%$1'));
  } catch (e) {
    str = hex;
    // console.log('invalid hex input: ' + hex)
  }
  return str;
}

export function trimExtra(extra: string) {
  try {
    const payload = fromHex(extra.substring(66));
    const payload_json = JSON.parse(payload);
    return fromHex(extra.substring(66));
  } catch (e) {
    return fromHex(Buffer.from(extra.substring(78)).toString());
  }
}

export class Timer {
  private timerId: any = null;
  private timeLeft: number = 5000;
  private onEnd: () => void;

  constructor(onEnd: () => void) {
    this.onEnd = onEnd;
  }

  async start(): Promise<void> {
    this.stop();
    this.timerId = setInterval(() => {
      this.timeLeft -= 1;
      // console.log('Timer', this.timeLeft);
      if (this.timeLeft <= 0) {
        this.stop();
        this.onEnd();
      }
    }, 1000);
  }

  reset(): void {
    this.stop();
    this.timeLeft = 5000;
  }

  stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

export function parse(json: any) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return false;
  }
}

export function lightenHexColor(hex, percent = 10) {
  // Ensure hex is a valid 6-character format
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
  }
  
  // Convert hex to RGB
  let num = parseInt(hex, 16);
  let r = (num >> 16) + (255 - (num >> 16)) * (percent / 100);
  let g = ((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * (percent / 100);
  let b = (num & 0x0000FF) + (255 - (num & 0x0000FF)) * (percent / 100);
  
  // Clamp values to 255 and convert back to hex
  const toHex = c => Math.min(255, Math.max(0, Math.round(c))).toString(16).padStart(2, '0');
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function extractHuginLinkAndClean(text: string): { link: string; cleanedMessage: string } {
  const regex = /hugin:\/\/[^\s]+\/[a-fA-F0-9]{128}/;
  const match = text.match(regex);

  if (match && match[0]) {
    const link = match[0];
    const cleanedMessage = text.replace(link, '').trim();
    return { link, cleanedMessage };
  }

  return { link: '', cleanedMessage: text };
}