const DEFAULT_NONCE_OFFSET = 39;

function hexToBytes(hex) {
  if (typeof hex !== 'string') throw new Error('hex_to_bytes_invalid');
  if (hex.length % 2 !== 0) throw new Error('hex_to_bytes_len');
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    const byte = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (!Number.isFinite(byte)) throw new Error('hex_to_bytes_parse');
    out[i] = byte;
  }
  return out;
}

function bytesToHex(bytes) {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function readVarint(buffer, offset) {
  let value = 0;
  let shift = 0;
  let bytes = 0;
  while (offset + bytes < buffer.length) {
    const byte = buffer[offset + bytes];
    value |= (byte & 0x7f) << shift;
    bytes += 1;
    if ((byte & 0x80) === 0) {
      return { value, bytes };
    }
    shift += 7;
    if (shift > 63) return null;
  }
  return null;
}

function getNonceOffsetFromBuffer(blobBuffer) {
  try {
    let offset = 0;
    const major = readVarint(blobBuffer, offset);
    if (!major) return DEFAULT_NONCE_OFFSET;
    offset += major.bytes;
    const minor = readVarint(blobBuffer, offset);
    if (!minor) return DEFAULT_NONCE_OFFSET;
    offset += minor.bytes;
    const timestamp = readVarint(blobBuffer, offset);
    if (!timestamp) return DEFAULT_NONCE_OFFSET;
    offset += timestamp.bytes;
    offset += 32;
    return offset;
  } catch (e) {
    return DEFAULT_NONCE_OFFSET;
  }
}

function getNonceOffset(blobHex) {
  const blobBuffer = hexToBytes(blobHex);
  return getNonceOffsetFromBuffer(blobBuffer);
}

function extractPrevIdFromBlob(blobHex) {
  try {
    const blobBuffer = hexToBytes(blobHex);
    let offset = 0;
    const major = readVarint(blobBuffer, offset);
    if (!major) return null;
    offset += major.bytes;
    const minor = readVarint(blobBuffer, offset);
    if (!minor) return null;
    offset += minor.bytes;
    const timestamp = readVarint(blobBuffer, offset);
    if (!timestamp) return null;
    offset += timestamp.bytes;
    if (offset + 32 > blobBuffer.length) return null;
    return bytesToHex(blobBuffer.subarray(offset, offset + 32));
  } catch (e) {
    return null;
  }
}

function nonceTagFromMessageHash(messageHash, bits) {
  const b = typeof bits === 'number' ? bits : 0;
  if (b <= 0 || b > 16) return 0;
  const mask = (1 << b) - 1;

  const src = String(messageHash || '').toLowerCase().replace(/[^0-9a-f]/g, '');
  if (src.length < 2) return 0;

  const value = parseInt(src.slice(0, 2), 16);
  if (!Number.isFinite(value)) return 0;
  return value & mask;
}

function stringToHex(str) {
  let out = '';
  for (let i = 0; i < str.length; i++) {
    out += str.charCodeAt(i).toString(16);
  }
  return out;
}

function nonceTagFromDigestHex(digestHex, bits) {
  const b = typeof bits === 'number' ? bits : 0;
  if (b <= 0 || b > 16) return 0;
  if (typeof digestHex !== 'string' || digestHex.length < 2) return 0;
  const mask = (1 << b) - 1;
  const firstByte = parseInt(digestHex.slice(0, 2), 16);
  if (!Number.isFinite(firstByte)) return 0;
  return firstByte & mask;
}

function nonceMatchesTag(nonceHex, tagValue, bits) {
  if (typeof nonceHex !== 'string' || nonceHex.length !== 8) return false;
  const b = typeof bits === 'number' ? bits : 0;
  if (b <= 0 || b > 16) return false;
  const mask = (1 << b) - 1;
  const nonceBytes = hexToBytes(nonceHex);
  if (nonceBytes.length !== 4) return false;
  const nonce = (
    (nonceBytes[0]) |
    (nonceBytes[1] << 8) |
    (nonceBytes[2] << 16) |
    (nonceBytes[3] << 24)
  ) >>> 0;
  return (nonce & mask) === (tagValue & mask);
}

module.exports = {
  getNonceOffset,
  extractPrevIdFromBlob,
  nonceTagFromMessageHash,
  stringToHex,
  nonceTagFromDigestHex,
  nonceMatchesTag,
};
