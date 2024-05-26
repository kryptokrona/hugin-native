import { decode as atob, encode as btoa } from 'base-64';
import en from 'int-encoder';

function isIPv6(ip: string): boolean {
  return ip.split(':').length === 8;
}

function decodeFingerprint(fingerprint: string): string {
  let decodedFingerprint = '';
  const letters = atob(fingerprint).split('');
  for (const letter of letters) {
    try {
      let piece = letter.charCodeAt(0).toString(16);
      if (piece.length === 1) {
        piece = '0' + piece;
      }
      decodedFingerprint += piece;
    } catch (err) {
      console.log('error', letter);
    }
  }
  decodedFingerprint = decodedFingerprint
    .toUpperCase()
    .replace(/(.{2})/g, '$1:')
    .slice(0, -1);
  return decodedFingerprint;
}

function decodeIP(ip: string, type: string): string {
  return type + ip;
}

export function expandSdpOffer(
  compressedString: string,
  incoming = false,
): { type: string; sdp: string } {
  console.log('Expanding sdp offer..');

  //   const type = compressedString.substring(0, 1);
  const split = compressedString.split(',');

  const iceUfrag = split[0].substring(1);
  const icePwd = split[1];
  const fingerprint = decodeFingerprint(split[2]);

  let ips = split[3];
  let prts = split[4];
  let externalIP = '';
  const externalPorts: string[] = [];
  const candidates = ['', '', '', ''];

  ips = ips.split('&').map((h) => decodeIP(h.substring(1), h.substring(0, 1)));
  prts = prts.split('&').map((h) => en.decode(h));

  let prio = 2122260223;
  let tcpPrio = 1518280447;
  let i = 1;
  let j = 1;
  let currentInternal = '';

  prts.forEach((port) => {
    const ipIndex = parseInt(port.slice(-1));
    if (i === 1) {
      currentInternal = port.substring(0, port.length - 1);
    }
    if (ips[ipIndex].substring(0, 1) === '!') {
      externalIP = ips[ipIndex].substring(1);
      externalPorts.push(port.substring(0, port.length - 1));
      candidates[j] += `a=candidate:3098175849 1 udp 1686052607 ${ips[
        ipIndex
      ].replace('!', '')} ${port.substring(
        0,
        port.length - 1,
      )} typ srflx raddr ${ips[0]
        .replace('!', '')
        .replace(
          '?',
          '',
        )} rport ${currentInternal} generation 0 network-id 3 network-cost 10\r\n`;
    } else if (port.substring(0, port.length - 1) === '9') {
      candidates[j] += `a=candidate:3377426864 1 tcp ${tcpPrio} ${ips[
        ipIndex
      ].replace('?', '')} ${port.substring(
        0,
        port.length - 1,
      )} typ host tcptype active generation 0 network-id 3 network-cost 10\r\n`;
      tcpPrio -= 500;
    } else {
      candidates[j] += `a=candidate:1410536466 1 udp ${prio} ${ips[
        ipIndex
      ].replace('?', '')} ${port.substring(
        0,
        port.length - 1,
      )} typ host generation 0 network-id 3 network-cost 10\r\n`;
      prio = Math.floor(prio * 0.8);
    }
    if (i === prts.length / 3) {
      i = 0;
      j += 1;
    }
    i += 1;
  });

  const externalIpOut = isIPv6(externalIP)
    ? `c=IN IP6 ${externalIP}`
    : `c=IN IP4 ${externalIP}`;
  if (!externalPorts[0]) {
    externalPorts[0] = '9';
  }

  const sdp = `v=0
o=- 5726742634414877819 3 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE data
a=msid-semantic: WMS
m=application ${externalPorts[0]} UDP/DTLS/SCTP webrtc-datachannel
${externalIpOut}
${candidates[1]}a=ice-ufrag:${iceUfrag}
a=ice-pwd:${icePwd}
a=fingerprint:sha-256 ${fingerprint}
a=setup:actpass
a=mid:data
a=sctp-port:5000
a=max-message-size:262144
`;

  return { sdp: sdp, type: 'offer' };
}

export function expandSdpAnswer(compressedString: string): {
  type: string;
  sdp: string;
} {
  const split = compressedString.split(',');
  console.log('split:', split);

  const iceUfrag = split[0].substring(1);
  const icePwd = split[1];
  const fingerprint = decodeFingerprint(split[2]);

  let ips = split[3];
  let prts = split[4];
  let candidates = '';
  let externalIP = '';

  ips = ips.split('&').map((h) => decodeIP(h.substring(1), h.substring(0, 1)));
  prts = prts.split('&').map((h) => en.decode(h));

  let externalPort = '';

  console.log('ips:', ips);
  console.log('ports:', prts);

  let prio = 2122260223;
  let tcpPrio = 1518280447;

  if (prts.length > 1) {
    prts.forEach((port) => {
      console.log('checking in answer port', port);
      const ipIndex = parseInt(port.slice(-1));
      if (ips[ipIndex].substring(0, 1) === '!') {
        if (externalPort.length === 0) {
          externalPort = port.substring(0, port.length - 1);
        }
        externalIP = ips[ipIndex].substring(1);
        candidates += `a=candidate:3098175849 1 udp 1686052607 ${ips[
          ipIndex
        ].replace('!', '')} ${port.substring(
          0,
          port.length - 1,
        )} typ srflx raddr ${ips[0].replace('?', '')} rport ${port.substring(
          0,
          port.length - 1,
        )} generation 0 network-id 3 network-cost 10\r\n`;
      } else if (port.substring(0, port.length - 1) === '9') {
        candidates += `a=candidate:3377426864 1 tcp ${tcpPrio} ${ips[ipIndex]
          .replace('?', '')
          .replace('!', '')} ${port.substring(
          0,
          port.length - 1,
        )} typ host tcptype active generation 0 network-id 3 network-cost 10\r\n`;
        tcpPrio -= 500;
      } else {
        candidates += `a=candidate:1410536466 1 udp ${prio} ${ips[
          ipIndex
        ].replace('?', '')} ${port.substring(
          0,
          port.length - 1,
        )} typ host generation 0 network-id 3 network-cost 10\r\n`;
        prio = Math.floor(prio * 0.8);
      }
    });
  } else {
    externalIP = ips[0].replace('!', '').replace('?', '');
    externalPort = prts[0].substring(0, prts[0].length - 1);
    candidates = `a=candidate:1410536466 1 udp 2122260223 ${externalIP} ${externalPort} typ host generation 0 network-id 3 network-cost 10\r\n`;
  }

  const ipOut = isIPv6(externalIP)
    ? `c=IN IP6 ${externalIP}`
    : `c=IN IP4 ${externalIP}`;
  if (!externalPort) {
    externalPort = '9';
  }

  const sdp = `v=0
o=- 5726742634414877819 3 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE data
a=msid-semantic: WMS
m=application ${externalPort} UDP/DTLS/SCTP webrtc-datachannel
${ipOut}
${candidates}a=ice-ufrag:${iceUfrag}
a=ice-pwd:${icePwd}
a=fingerprint:sha-256 ${fingerprint}
a=setup:active
a=mid:data
a=sctp-port:5000
a=max-message-size:262144
`;

  return { sdp: sdp, type: 'answer' };
}

export function parseSdp(sdp: { sdp: string }, answr = false): string {
  let iceUfrag = '';
  let icePwd = '';
  let fingerprint = '';
  const ips: string[] = [];
  const prts: string[] = [];
  const ssrcs: string[] = [];
  let msid = '';
  let ip = '';
  let port = '';

  const lines = sdp.sdp.split('\n').map((l) => l.trim());
  lines.forEach((line) => {
    if (line.includes('a=fingerprint:') && fingerprint === '') {
      //   const parts = line.substr(14).split(' ');
      const hex = line
        .substr(22)
        .split(':')
        .map((h) => parseInt(h, 16));
      fingerprint = btoa(String.fromCharCode(...hex));
    } else if (line.includes('a=ice-ufrag:') && iceUfrag === '') {
      iceUfrag = line.substr(12);
    } else if (line.includes('a=ice-pwd:') && icePwd === '') {
      icePwd = line.substr(10);
    } else if (line.includes('a=candidate:')) {
      const candidate = line.substr(12).split(' ');
      ip = candidate[4];
      port = candidate[5];
      const type = candidate[7];
      ip = type === 'srflx' ? '!' + ip : '?' + ip;
      if (!ips.includes(ip)) {
        ips.push(ip);
      }
      const indexedPort = port + ips.indexOf(ip).toString();
      prts.push(en.encode(parseInt(indexedPort)));
    } else if (line.includes('a=ssrc:')) {
      const ssrc = en.encode(parseInt(line.substr(7).split(' ')[0]));
      if (!ssrcs.includes(ssrc)) {
        ssrcs.push(ssrc);
      }
    } else if (line.includes('a=msid-semantic:')) {
      msid = line.substr(16).split(' ')[2];
      console.log('msid', msid);
    }
  });

  return `${iceUfrag},${icePwd},${fingerprint},${ips.join('&')},${prts.join(
    '&',
  )}`;
}
