import tweetnacl from 'tweetnacl';

const hexToUint = (hexString: string) =>
  new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

export function naclHash(val: string) {
  const hash = tweetnacl.hash(hexToUint(val));
  return hash.toString();
}

export function randomKey() {
  return Buffer.from(tweetnacl.randomBytes(32)).toString('hex');
}
