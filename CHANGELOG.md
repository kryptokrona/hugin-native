# Changelog

## Unreleased

### hugin-network and hugin-pow

- The worklet's P2P library is now `hugin-network` (the package formerly developed as hugin-p2p
  3.0; hugin-p2p 2.x on npm is a different code base): `require('hugin-network')` and
  `hugin-network/keys`, `/sanitize`, `/wire`, `/push`, and `hugin-network/dm` on the React Native
  side (Metro resolves it through `metro.config.js`). Same wire format, so peers on the earlier
  checkouts share rooms. Worklet log lines start with `[hugin-network]`.
- Proof of work runs on hugin-pow (new dependency): hugin-network's node client mines through
  hugin-pow's JobTracker with the worklet's backend, `findShare({ blobHex, targetHex, startNonce,
  maxAttempts })` (the `pow-find-share` request, unchanged on the React Native side, nonce tags 0)
  and `powHash(blobHex)` (the existing `cn-turtle-lite-slow-hash-v2` request; hugin-pow checks
  the native module against its reference vector and every share it reports). Slice sizes come
  from hugin-pow (about 250 ms at the measured hash rate) instead of 20 s at an assumed 1 kH/s,
  so a job of a new block stops the search quickly.

### DM delivery state, node sync answers, one row per DM

- **Long DMs**: a DM payload that does not fit a node post (`fitsNode` false) goes over the
  contact's DM swarm only. `Wallet.send_message` now sends it with the new `beam_dm` request,
  which the worklet answers with the number of the contact's peers it was written to. With none,
  nothing is sent and the answer is `{ success: false, error: 'contact_offline' }`: the message
  screen shows the message as not delivered (failed, with the resend button) and sends it again
  when the contact connects while the screen is open. A DM that fits a node post and reaches no
  peer over the DM swarm is posted to the node.
- **Node sync**: every entry of a sync answer (hugin-node answers with the newest 500 entries
  after `timestamp`) is opened, in slices of 299. The next sync asks from the newest entry of the
  answer less 30 seconds (never after the local clock); entries seen before are skipped. A poll
  does not start while the previous one runs. Returning to the foreground restarts the poll
  (`MessageSync.restart`).
- **One row per DM**: received DMs are stored under their message id, the DM payload's
  `messageHash` (equal to the pool hash), by the node sync, the DM swarm, the foreground push and
  the background push queue alike; `messageExists` looks up that id. A received DM is not saved
  again when its conversation already has a received DM with the same timestamp. The
  conversation view shows one message for rows with the same conversation, direction, timestamp
  and text, preferring the row stored under the message id. An own message saved again under its
  hash replaces its row, so its status (pending, failed, success) is kept in the database. The
  background push queue keeps one entry per message id.

### crypto.getRandomValues at startup

- `shim.js`, the first module `index.js` imports, sets up `crypto.getRandomValues` before any
  other module loads: from react-native-crypto (the app's `crypto`), which installs it when it
  loads, or built on its `randomBytes` when it did not. The app stops at startup with an error
  when `crypto.getRandomValues` is still missing. hugin-crypto's noble modules and the
  per-message key of hugin-p2p/dm (64 random bytes reduced mod l, on React Native from
  `crypto.getRandomValues`) read it.

### DMs on hugin-p2p/dm

Direct messages are built and opened by `DmCrypto` from `hugin-p2p/dm`, the module hugin-desktop
uses too: one payload layout and one ML-KEM handshake on both apps (hugin-p2p README, "Wire
format › DM payloads"). DM payloads in the earlier form (hex of a JSON object) are not opened any
more, and contacts on earlier versions cannot read the new ones.

- **One `DmCrypto` per wallet** (`src/services/hugin/dm.js`), shared by the syncer, the push
  handler and the wallet. Its hooks: the wallet's primary address and the user's name, the
  spend key signature (`Wallet.sign(message, true)`), `Wallet.verify`, the key derivation with
  the wallet's private view key, the contact state in SQLite and the ML-KEM identity in the
  Keychain. The crypto provider is `hugin-crypto`.
- **Receiving**: the node poll opens pool entries with `openPool` (each pool hash once, oldest
  first; entries that are not DM payloads are passed over); DM swarm payloads and pushes are
  opened with `open`. A message is saved only when its sender's signature verifies; a new sender
  is added as a contact and its DM swarm is opened, as before.
- **Sending**: `Wallet.send_message` posts the payload to the hugin-node, or sends it over the DM
  swarm when asked. A payload longer than a node post takes (a long text, most often with the
  handshake fields) goes over the DM swarm only. The post carries the payload's message hash and
  the recipient's push view tag. Sending does not change the contact's handshake state.
- **DM swarm key**: `Wallet.key_derivation_hash` is `DmCrypto.derivationHash`, the same value as
  before.
- **ML-KEM identity**: kept in the same Keychain entry (`kem-identity`), so the identity does not
  change. A new key pair is made only when there is no entry; when the Keychain cannot be read,
  sending to a contact without a key fails and no new identity is written.
- **Database**: a new table `contact_crypto` (one row per address: message key, pending capsule,
  the contact's ML-KEM public key, the timestamp of the last handshake step, older keys),
  created on start when it is missing. Existing tables and rows are not changed; the ML-KEM
  columns of `contacts` are no longer read or written. The table starts empty, so every contact
  starts a new handshake with the first message. `resetDB` drops it with the other tables.
- **Metro** resolves `hugin-p2p/dm` through the package's `exports` map (`metro.config.js`);
  package exports stay off for every other import.
- Tests: `node test/dm-crypto.js` (Node.js 22.5 or later) runs two and three users through the
  app's wallet, syncer, push handler, SQLite table and Keychain code with stand-ins for React
  Native.

### Bare worklet on hugin-p2p's HuginP2P

Rooms, DMs, the feed, files, room calls and the hugin-node connection of the worklet now run on
one `HuginP2P` instance from `hugin-p2p` (3.0.0-alpha.4). `bare/swarm.js` and `bare/storage.js`
are removed; `bare/host.js` is the host the library talks to, `bare/main.js` routes React
Native's requests into it. React Native sends the same requests and gets the same events.

- **`bare/host.js`**: the library's host hooks over `Hugin.request` to React Native
  (`sign-message` with the spend key, `verify-signature`, `room-message-exists`,
  `get-room-history`, `get-room-message`, `get-latest-room-hashes`, `feed-message-exists`,
  `get-feed-history`, `pow-find-share` for proof of work), bans and blocks, file auto-sync
  (DMs always, rooms per `syncImages`), known files, and the paths: drives stay at
  `<store>/corestorage/<topic>/files`, so existing drives and drive keys are kept; fetched files
  are also written to the download directory, as before. Its event table maps every library
  event to the bare-rpc events React Native listens to (`peer-connected`, `new-swarm`,
  `swarm-message`, `history-update`, `beam-message`, `typing`, `feed-message`,
  `voice-channel-status`, `join-voice-channel`, `answer-call`, `got-answer`,
  `got-expanded-voice-channel`, `room-remote-file-added`, `remote-dm-file-added`, `downloading`,
  `download-file-progress`, `file-downloaded`, `dm-file`, `hugin-node-connected`,
  `hugin-node-disconnected`, `node-address`, `pool-messages`, `ban-user`, `end-swarm`,
  `peer-disconnected`, `error-message`) or ignores it explicitly.
- **`bare/main.js`** answers every request type React Native sends (`new_swarm`, `end_swarm`,
  `send_room_msg`, `send_feed_msg`, `beam_message`, `typing`, `voice_status`, `send_sdp`,
  `begin_send_file`, `send_dm_file`, `group_download`, `save_to_downloads`, `idle_status`,
  `close_connections`, `connect_to_node`, `sync_from_node`, `send_node_msg`, the push requests,
  keys and sealed boxes) with the shapes it had. `new-swarm` carries `admin` as a boolean.
- **Room messages are signed** (hugin-p2p 3.0): our own are signed by the wallet when sent, and
  every received one, live or as history, is checked against its author's signature before
  React Native sees it. Room and feed messages reach React Native with every field as signed,
  `signature` included, and React Native stores them that way and serves them back as history.
  Our own message text is normalised (markup removed, entities decoded) before it is signed, as
  hugin-desktop does.
- **Database**: `roomsmessages` and `feedmessages` get a `signature` column (`TEXT DEFAULT ''`),
  added on start when it is missing (existing rows keep `''` and are not offered to peers as
  history). `get-room-history` and `get-room-message` return it; received messages and room
  pushes are saved with it, and the signature of our own sent room and feed messages is kept
  from the worklet's answer until the message is saved.
- **Feed** messages are forwarded to other room peers only while the app is in the foreground.
- **DM swarms** keep one connection, to the contact's verified identity only.
- **Lifecycle**: `idle_status` maps to the library's idle (`force` suspends at once, background
  suspends after 10 s, foreground resumes); `close_connections` closes the room connections and
  lets the swarms reconnect. The worklet registers its process handlers once, at start.
- **Bridge**: requests go out as bare-rpc command 1 and answers and events as command 2 on both
  sides; an answer is matched to a request only on command 2. The worklet's lookups to React
  Native wait at most 30 s (wallet requests 60 s, proof of work without limit).
- No code sets Hyperswarm's `peerInfo.priority` any more.

### Transaction version 2 (fork 14): view tags and CLSAG signatures

`kryptokrona-wallet-backend-js` 2.7.0 and `kryptokrona-utils` 1.5.0 come from the local fork-14
checkouts (`file:../kryptokrona-wallet-backend-js`, `file:../kryptokrona-utils`, until they are
published), with `overrides` entries so every package in the tree uses the same copy, as for
`kryptokrona-crypto`. The wallet builds transaction version 2 when the daemon accepts it.

- `src/services/NativeTest.js` exports `deriveViewTag(derivation, outputIndex)` (two lowercase
  hex characters), `clsagSign(prefixHash, ring, privateEphemeral, realOutputIndex, alpha,
  decoyResponses)` (`{ c1, s }`; `alpha` `''` and `decoyResponses` `[]` for fresh randomness) and
  `clsagVerify(prefixHash, ring, keyImage, c1, s)` (boolean), on the `KryptokronaCrypto` module.
- `src/config/wallet-config.js` registers them as the wallet-backend config hooks
  `deriveViewTag`, `clsagSign` and `clsagVerify`.
- `test/native-crypto.js` checks them against kryptokrona-crypto's view-tag and CLSAG vectors and
  with sign/verify round trips, and checks the hooks `wallet-config.js` registers.

### Crypto from kryptokrona-crypto 2.0 on iOS and Android

The wallet's crypto functions now run on `kryptokrona-crypto` 2.0's native module
`KryptokronaCrypto` (the Kryptokrona node's Rust crypto core behind a C++ Turbo Native Module,
autolinked from the package), the same implementation on iOS and Android. The app's own copies of
the C/C++ crypto sources (`ios/crypto/`, `android/app/src/main/jni/`), the JNI glue
(`Java.cpp`, `Java.h`, `Android.mk`, `Application.mk`) and the Java helper classes
(`RawTransaction`, `InputMap`, `TransactionInput`, `WalletBlockInfo`, `KeyOutput`, `KeyPair`,
`SpendKey`) are removed.

- `src/services/NativeTest.js` keeps every export with its name, arguments and result shape and
  calls the module; `wallet-config.js`, `wallet.js` and `src/lib/rpc.js` are unchanged.
- `NativeModules.TurtleCoin` remains as the app's platform module with `getWalletSyncData`,
  `getInitialVoipPayload` (iOS, now `ios/TurtleCoinModule/`, plain Objective-C) and
  `navigateToBatteryOptimizationScreen` / `isDozeDisabled` (Android), unchanged.
- Hex arguments of the wrong length or with non-hex characters reject on both platforms;
  `findPowShare` resolves `{ job_id: '', nonce, result, hashes_performed, threads }`,
  `{ hashes_performed, threads }` or `null` on both; a missing `globalIndex` reads as `-1` (then
  `undefined`) on both. Coinbase outputs found by `processBlockOutputs` are matched to the
  block's coinbase transaction.
- `test/native-crypto.js` (`npm run test:native-crypto`) checks every export on Node.js with a
  stand-in for the module backed by kryptokrona-crypto's Node-API addon.

### kryptokrona-crypto without a patch

`kryptokrona-crypto` comes from the local fork-14 checkout (`file:../kryptokrona-crypto`, version
1.1.0, until it is published) and is used unpatched: its new `react-native` entry point starts in
external mode (the functions of `NativeModules.TurtleCoin`) and never requires the addon or the
asm.js/WASM builds, which is what `patches/kryptokrona-crypto+1.0.3.patch` did by editing
`dist/index.js`. That patch and `patches/bindings+1.5.0.patch` (`fs` → `bare-fs` in `bindings`,
which Metro only reached through the addon loader) are removed. An `overrides` entry makes
`kryptokrona-utils` use the same copy. The wallet's crypto functions and how they are registered
are unchanged.

### Bare worklet uses hugin-p2p's pure modules

The worklet (`bare/`) now uses `hugin-p2p/keys`, `/sanitize`, `/wire`, `/pow` and `/push`
through `bare/adapter.js` instead of its own copies. Topics, the Hugin handshake, admin and
identity signatures, PoW auth signatures and push encryption are byte-identical to before; the
bare-rpc events to React Native keep their names and fields. Swarm lifecycle (node connection
with 3 peers and backups, suspend/resume, idle handling) is unchanged.

Behaviour changes:

- **Room invites** created on this device derive the invite's admin key from the hex admin seed,
  as hugin-desktop does. The admin signature sent in `joined` now verifies against such invites
  (before, the invite key came from the raw seed bytes while signing used the hex seed). Existing
  invites are unchanged.
- **DM swarms** keep one connection (`maxPeers: 1`) and admit only the contact. Which peer
  is the contact is known once its `joined` has arrived and its `idSig` has been verified; a
  verified peer with another address (including the user's own other device, which derives the
  same topic) is closed and its DHT key refused by the swarm's firewall from then on. Before that
  verification only `joined` and `disconnected` are processed on a DM connection; a DM payload
  that arrives first waits up to 5 s for the sender's `joined`.
- **Incoming messages** are decoded and validated by `hugin-p2p/wire`/`sanitize` (accept: what
  either old app sends). The library's `ban` flag decides bans. Newly banned: malformed feed
  messages, a non-string `type`, `Ping`/`request-messages` whose `hashes` or `peers` is not an
  array, file announcements with a missing or non-numeric `size` or `time`. No longer banned: a `joined`
  avatar that is not well-formed base64 (the avatar is dropped). Accepted now: room messages with
  `address`/`hash` up to 128 characters (hugin-desktop's limits).
- Feed messages (live and history) and room-call SDP messages are validated before they are
  forwarded; invalid ones are dropped.
- Typing messages are handled as typing only (in DM swarms they were also forwarded as
  `beam-message`); JSON objects in DM swarms are not forwarded as `beam-message`.
- Received message text and names (room messages, feed messages, `joined`, voice status) go
  through `sanitizeText`: markup removed, entities decoded, other text (emoji, any script)
  unchanged.
- Received values are normalised: timestamps, file sizes and times are numbers, an SDP's `retry`
  is always a boolean.
- **Outgoing messages** are built with `hugin-p2p/wire` (send: what both old apps accept):
  - `joined.time` is sent as a string; `driveKey` is left out unless it is 64 hex characters;
    the avatar is left out when it is not well-formed base64 or larger than 200 000 bytes;
    the room history is left out when the message would exceed 2 MiB.
  - A room or feed message that an old peer would refuse (for example a name over 50 characters)
    is not sent to peers but still returned to React Native; `reply` is `''` instead of `null`.
  - `Ping` carries at most the last 100 peers, 25 hashes and the 10 most recent files;
    `request-history`/`send-history` at most 10 files, `send-history` without messages above
    2 MiB. No message above 2 MiB is sent.
  - Voice status, SDP, typing and file announcements that do not pass the builders are not sent.
- **hugin-node**: a sync request always carries a numeric `timestamp` (0 when none is given).
  Posts with a cipher that is not hex or longer than 9000 characters, a bad hash or kind are
  refused locally (`invalid_packet`), and packets above 9000 bytes are not sent
  (`packet_too_large`); the node bans senders of either. A share is also recalculated after
  `invalid pow` and `share_reused`, and the next attempt waits 1 s after `cooldown` or
  `rate_limit` (was 100 ms).
- **Room push** payloads carry the room message fields only (`hash, room, address, message, name,
  reply, signature, timestamp, tip`); before, the whole object React Native passed, including the
  RPC's `id` and `type`.
- `decrypt_sealed_box` returns `'fail'` for a cipher shorter than a sealed box (was an exception).
- `sha512_hex` reads its input like React Native's `naclHash` (`hexToUint`); identical for
  well-formed hex.

Removed:

- Legacy beams: `bare/beam.js`, `bare/huginbeam.js` (`new_beam`, `BEAM://`, `BEAMFILE://`) and the
  file beams in `bare/storage.js` (`start_beam`, `upload`, `download`, `close`, `load`, `check`).
  React Native never invoked them.
- The `request_download` RPC (it sent a `download-request` that no app answers; React Native
  never sends it).
- `bare/pow-utils.js` and `bare/messages.js` (now `hugin-p2p/pow` and `hugin-p2p/push`).
- Dependencies `streamx` and `queue-tick` (only the beam port used them).

Fixes:

- `save_to_downloads` failed with a `ReferenceError` (`Storage` was not imported in
  `bare/main.js`).
- `request_download` failed with a `ReferenceError` (not imported); the RPC is removed (above).

Tests: `bare/test/` (brittle), `npm run test:bare` or `npx brittle bare/test/*.test.js`.
