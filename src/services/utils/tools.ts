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
