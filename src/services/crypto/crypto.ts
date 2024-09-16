import tweetnacl from 'tweetnacl';

const hexToUint = (hexString) =>
    new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

export function naclHash(val) {
    const hash = tweetnacl.hash(hexToUint(val));
    return hash.toString();
}

function randomKey() {
    return Buffer.from(tweetnacl.randomBytes(32)).toString('hex');
  }