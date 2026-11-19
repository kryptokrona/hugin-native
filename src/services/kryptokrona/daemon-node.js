// The wallet's node: `url:port` over HTTP, or an xkrd node over Hyperswarm for the node
// `hyperswarm` (any node on the wallets topic) or a private node's invite `xkr:…`. The
// Hyperswarm requests run in the Bare worklet (hugin-network/xkr-daemon); React Native only
// forwards them (Daemon.withRequester), so it never loads Hyperswarm itself.

/** The node that means "an xkrd node found over Hyperswarm" (the default). */
export const SWARM_NODE = 'hyperswarm';

/** The default node: a phone runs no node of its own, so Hyperswarm. */
export const DEFAULT_NODE = { url: SWARM_NODE, port: 0 };

/** The node-list entry for Hyperswarm. */
export const SWARM_LIST_ENTRY = { name: 'Hyperswarm (automatic)', url: SWARM_NODE, port: 0, ssl: false, swarm: true };

/** Whether `url` goes over Hyperswarm. */
export function isSwarmNode(url) {
  return url === SWARM_NODE || (typeof url === 'string' && url.startsWith('xkr:'));
}

/** `{ url, port }` of a saved or typed node: `url:port`, `hyperswarm[:0]` or `xkr:…[:0]`. */
export function parseNode(text) {
  const s = String(text || '').trim();
  if (!s) return { ...DEFAULT_NODE };
  const i = s.lastIndexOf(':');
  const host = i > 0 ? s.slice(0, i) : s;
  if (isSwarmNode(host)) return { url: host, port: 0 };
  if (isSwarmNode(s)) return { url: s, port: 0 };
  return { url: host, port: parseInt(s.slice(i + 1)) };
}

/** A DaemonRequester that forwards to the Bare worklet (`request` from src/lib/native.js). */
export function swarmRequester(url, request) {
  const invite = url === SWARM_NODE ? undefined : url;
  return {
    label: invite ? 'hyperswarm (private node)' : SWARM_NODE,
    request: (method, path, body) => request(method, path, body, invite),
  };
}
