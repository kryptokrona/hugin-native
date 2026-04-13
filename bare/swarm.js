const HyperSwarm = require('hyperswarm-hugin');
const Protomux = require('protomux');
const c = require('compact-encoding');
const { Hugin } = require('./account');
const {
  get_new_peer_keys,
  sanitize_group_message,
  sanitize_join_swarm_data,
  sanitize_voice_status_data,
  random_key,
  toUintArray,
  verify_signature,
  sign_admin_message,
  sanitize_file_message,
  check_if_media,
  check_hash,
  room_message_exists,
  sign,
  sleep,
  sanitize_typing_message,
  logPow,
  validate_pow_job,
} = require('./utils');
const {
  extractPrevIdFromBlob,
} = require('./pow-utils');
const {
  send_file,
  start_download,
  add_remote_file,
  add_local_file,
  update_remote_file,
} = require('./beam');
const { Storage } = require('./storage.js');
const RPC = require('bare-rpc');
const b4a = require('b4a');

const process = require('bare-process');

process.on('uncaughtException', (err) => {
  console.log('Caught an unhandled exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});


const LOCAL_VOICE_STATUS_OFFLINE = {
  voice: false,
  video: false,
  topic: '',
  videoMute: false,
  audioMute: false,
  screenshare: false,
};

const MISSING_MESSAGES = 'missing-messages';
const REQUEST_MESSAGES = 'request-messages';
const REQUEST_HISTORY = 'request-history';
const REQUEST_FEED = 'request-feed';
const SEND_HISTORY = 'send-history';
const SEND_FEED_HISTORY = 'send-feed-history';
const PING_SYNC = 'Ping';
const REQUEST_FILE = 'request-file';

const ONE_DAY = 24 * 60 * 60 * 1000
const MAX_NATIVE_POW_ATTEMPTS = 5000000;
const POW_TOTAL_HASHES_PER_SECOND_CAP = 3000;
const POW_PHASE1_HASHES_PER_SECOND_CAP = 2000;
const POW_PHASE2_HASHES_PER_SECOND_CAP = 1000;
const POW_PHASE1_MS = 2 * 60 * 1000;
const POW_SLICE_MS_PHASE1 = 20000;
const POW_SLICE_MS_PHASE2 = 20000;
const POW_MAX_JOB_TIME_MS = 90000;
const POW_REQUIRED_SHARES = 1;
let active_pow_tasks = 0;

const is_timeout_error = (error) => {
  return error?.code === 'ETIMEDOUT' || error?.message === 'Connection timed out';
};

function pow_rate_policy(active_tasks, elapsed_ms) {
  const in_phase1 = elapsed_ms < POW_PHASE1_MS;
  const per_task_budget = Math.max(
    1,
    Math.floor(POW_TOTAL_HASHES_PER_SECOND_CAP / Math.max(1, active_tasks)),
  );
  const hashes_per_second = Math.min(
    per_task_budget,
    in_phase1 ? POW_PHASE1_HASHES_PER_SECOND_CAP : POW_PHASE2_HASHES_PER_SECOND_CAP,
  );
  const time_budget_ms = in_phase1 ? POW_SLICE_MS_PHASE1 : POW_SLICE_MS_PHASE2;
  return { hashes_per_second, time_budget_ms, in_phase1 };
}

let active_voice_channel = LOCAL_VOICE_STATUS_OFFLINE;
let active_swarms = [];
let localFiles = [];
let feed_requests = [];
let feed_requests_started = false;
let pending_feed_requests = new Map();
let idletimer = null;

let last_activity = Date.now();

const RPC_COMMANDS = Object.freeze({
  PACKET: 1,
});

const feed_request_process = async () => {

  feed_requests_started = true;

  console.log('Starting to request feeds with ', feed_requests?.length, 'entries.')

  for (const request of feed_requests) {
    console.log('Requesting feed from', request.address);
    if (pending_feed_requests.has(request.address)) continue;
    pending_feed_requests.set(request.address);
    const start_time = Date.now();
    request_feed(request.address, request.topic);
    while (pending_feed_requests.has(request.address) && (Date.now() - start_time < 5*1000)) {
      await sleep(50);
    }
    if (Date.now() - start_time >= 5*1000) {
      console.log('Feed request timed out!');
    }
    feed_requests.shift();
    pending_feed_requests.delete(request.address);
    console.log('Completed feed request from ', request.address, ',', feed_requests?.length, ' requests left.')
  }
  if (feed_requests?.length) {
    feed_request_process()
  } else {
    feed_requests_started = false;
  }

}

class NodeConnection {
  constructor() {
    this.node = null
    this.connection = null
    this.rpc = null
    this.requests = new Map()
    this.discovery = null
    this.pending = []
    this.public = 'xkr96c0f8a36e951b399681d447922f6c54c28c6ef3cad1c65d3568008151337'
    this.topic = ''
    this.address = null
    this.backup_connections = [];
    this.currentJob = null;
    this.jobGeneration = 0;
    this.currentPrevId = null;
    this.previousPrevId = null;
    this.twoBackPrevId = null;
    this.jobPollTimer = null;
    this.pow_backend = {
      find_share: async ({
        job,
        hashes_per_second,
        time_budget_ms,
        nonce_tag_bits,
        nonce_tag_value,
      }) => {
        // Since we are moving to native, we want the native thread to run as hot as possible
        // for the allocated time_budget_ms, ignoring artificial Javascript-side hashes_per_second caps.
        // We will pass MAX_NATIVE_POW_ATTEMPTS and rely on native or a time check.
        // But the native iOS module 'findPowShare' doesn't have a time check.
        // So we will request a large number of attempts, let native run for roughly `time_budget_ms`
        // assuming optimistic 1KH/s for the attempt cap, or use the JS capped value if we prefer.
        // Let's rely on time_budget_ms * optimistic_hash_rate / 1000
        const optimistic_hps = 1000;
        const maxAttempts = Math.max(
          1,
          Math.floor((optimistic_hps * parseInt(time_budget_ms, 10)) / 1000),
        );
        const clampedAttempts = Math.min(maxAttempts, MAX_NATIVE_POW_ATTEMPTS);
        const startNonce = Math.floor(Math.random() * 0xffffffff);
        const clampedNonceTagBits = Math.max(0, Math.min(16, parseInt(nonce_tag_bits, 10) || 0));
        const clampedNonceTagValue = (parseInt(nonce_tag_value, 10) || 0) >>> 0;
        console.log('findPowShare called with max attempts:', clampedAttempts);
        const share = await Hugin.request({
          type: 'pow-find-share',
          blobHex: job.blob,
          targetHex: job.target,
          startNonce,
          maxAttempts: clampedAttempts,
          nonceTagBits: clampedNonceTagBits,
          nonceTagValue: clampedNonceTagValue,
        });
        if (share && !share.job_id) {
          share.job_id = String(job.job_id);
        }
        return share || null;
      },
    };
  }

async reset(address, pub) { 
    if (this.jobPollTimer) {
      clearInterval(this.jobPollTimer);
      this.jobPollTimer = null;
    }
    this.node = null
    this.connection = null
    this.requests = new Map()
    this.discovery = null
    this.pending = []
    this.public = 'xkr96c0f8a36e951b399681d447922f6c54c28c6ef3cad1c65d3568008151337'
    this.topic = ''
    this.address = null
    this.backup_connections = [];
    this.currentJob = null;
    this.jobGeneration = 0;
    this.currentPrevId = null;
    this.previousPrevId = null;
    this.twoBackPrevId = null;

    this.connect('', true);

}

async connect(address, pub) {
  console.log('Connecting to node..');
  //If we choose the public option. We connect to the first responding node.
  //in the public network.
  const key = pub ? this.public : address
  const [base_keys, dht_keys, sig] = get_new_peer_keys(key)
  const topicHash = base_keys.publicKey.toString('hex')
    this.node = new HyperSwarm({ maxPeers: 3,
    firewall (remotePublicKey) {

    //If we are connecting to a public node. Allow connection.
    if (pub) return false
    
    //We verify if the private node has the correct public key.
    if (remotePublicKey.toString('hex') !== address.slice(-64)) {
      return true
    }
    return false
    }}, sig, dht_keys, base_keys)

  this.listen()
  const topic = Buffer.alloc(32).fill(topicHash)
  this.topic = topic
  this.discovery = this.node.join(topic, {server: false, client: true})
}

async listen() {
  this.node.on('connection', (conn, info) => {
    info.priority = 3
    if (this.connection) {
      this.backup_connections.unshift(conn);
      return;
    }
    this.node_connection(conn)
  })

  process.once('SIGINT', function () {
    this.node.on('close', function () {
        process.exit();
    });
    this.node.destroy();
    setTimeout(() => process.exit(), 2000);
  });

  }
  async node_connection(conn) {
    this.connection = conn
    this.rpc = new RPC(conn, (req) => {
      const packet = this.parse(b4a.toString(req.data));
      if (packet) {
        this.handle_node_packet(packet);
      }
      req.reply(JSON.stringify({ ok: true, data: null, error: null }));
    });
    Hugin.send('hugin-node-connected', {})
    conn.on('error', (error) => {
    if (is_timeout_error(error)) {
      console.log('Node connection timed out, reconnecting');
    } else {
      console.log("Got error connection signal", error)
    }
        conn.end();
        conn.destroy();
        this.connection = null
        this.reconnect()
   })

   conn.on('data', () => {})
}

handle_node_packet(data) {
  if (data.type === 'new-message' && Array.isArray(data.messages)) {
    Hugin.send('pool-messages', {
      messages: data.messages,
      background: Hugin.background,
    })
    return
  }
  if ('address' in data) {
    if (typeof data.address !== 'string') return
    if (data.address?.length !== 99) return
    this.address = data.address
    Hugin.send('node-address', {address: data.address})
    return
  }

  if (data.type === 'job' && data.job && !this.requests.has(data.id)) {
    logPow('job_push', { type: data.type, jobId: data.job && data.job.job_id });
    const validation = validate_pow_job(data.job);
    if (validation.ok) {
      this.set_job(data.job);
    } else {
      logPow('job_reject', { reason: validation.reason });
    }
    return;
  }
  if (this.requests.has(data.id)) {
    const { resolve } = this.requests.get(data.id);
    if ('chunks' in data) {
      this.pending.push(data.response)
      return
    }
    if ('done' in data) {
      resolve(this.pending);
      this.requests.delete(data.id);
      return
    }

    if ('success' in data) {
      resolve(data)
      this.requests.delete(data.id);
      return
    }

    if (data.type === 'job' || data.type === 'job_pending') {
      logPow('job_response', {
        id: data.id,
        type: data.type,
        jobId: data.job && data.job.job_id,
      });
      if (data.job) {
        const validation = validate_pow_job(data.job);
        if (validation.ok) {
          this.set_job(data.job);
        } else {
          logPow('job_reject', { reason: validation.reason });
        }
      }
      resolve(data);
      this.requests.delete(data.id);
      return;
    }

    resolve(data.response);
    this.requests.delete(data.id);
  }
}

async change(address, pub) {
  if (this.node) {
  await this.node.leave(Buffer.from(this.topic))
  await this.node.destroy()
  if (this.connection !== null) {
    this.connection.end()
    this.connection = null
  }
  this.node = null
  this.discovery = null
  this.address = null
  }
  Hugin.send('hugin-node-disconnected', {})

  this.connect(address, pub)
}

async reconnect() {
  let tries = 0;
  while(this.connection === null && tries < 4) {
    Hugin.send('hugin-node-disconnected', {})
    console.log("Reconnecting to node...")
    if (this.backup_connections?.length > 0) {
      this.connection = this.backup_connections.at(-1);
      Hugin.send('hugin-node-connected', {})
      this.backup_connections.pop();
    }
    Nodes.node.resume();
    this.discovery.refresh({client: true, server: false})
    await sleep(2000);
    tries += 1;
  }
  this.reset();
  return;
}

send_packet(packet) {
  if (!this.rpc) return false;
  try {
    const req = this.rpc.request(RPC_COMMANDS.PACKET);
    req.send(JSON.stringify(packet));
    req.reply().catch(() => {});
    return true;
  } catch (e) {
    return false;
  }
}

sync(data) {
  if (!this.connection) return [];
  return new Promise((resolve, reject) => {
    this.pending = [];
    data.id = data.timestamp
    this.requests.set(data.id, { resolve, reject });
    if (!this.send_packet(data)) {
      console.error('Error writing to connection: send_packet_failed');
      this.requests.delete(data.id);
      resolve([]);
    }
  });
}

set_job(job) {
  console.log('job', job)
  if (!job || !job.job_id) return;
  if (this.currentJob && this.currentJob.job_id === job.job_id) return;
  const prevId = extractPrevIdFromBlob(job.blob);
  if (prevId) {
    this.twoBackPrevId = this.previousPrevId;
    this.previousPrevId = this.currentPrevId;
    this.currentPrevId = prevId;
  }
  this.currentJob = job;
  this.jobGeneration++;
  logPow('job_set', { jobId: job.job_id });
}

async request_job() {
  if (!this.connection) return null;
  return new Promise((resolve, reject) => {
    const id = random_key().toString('hex');
    this.requests.set(id, { resolve, reject });
    const sent = this.send_packet({
      type: 'job_request',
      id,
    });
    if (!sent) {
      this.requests.delete(id);
      resolve(null);
      return;
    }
    logPow('job_request', { id });
    setTimeout(() => {
      if (this.requests.has(id)) {
        this.requests.delete(id);
        logPow('job_request_timeout', { id });
        resolve(null);
      }
    }, 10000);
  });
}

build_pow_auth(message_hash, timestamp, shares, context = '') {
  if (!Array.isArray(shares) || !shares.length) return null;
  const share = shares[0];
  const [, oneTimeKeys] = get_new_peer_keys(random_key());
  const signer = oneTimeKeys && oneTimeKeys.get ? oneTimeKeys.get() : null;
  if (!signer || !signer.sign || !signer.publicKey) return null;
  const payload = `powsig:v2:${String(message_hash || '')}:${timestamp}:${String(share.job_id || '')}:${String(share.nonce || '').toLowerCase()}:${String(share.result || '').toLowerCase()}:${String(context || '')}`;
  const sig = signer.sign(Buffer.from(payload));
  if (!sig) return null;
  return {
    pub: Buffer.from(signer.publicKey).toString('hex'),
    sig: Buffer.from(sig).toString('hex'),
    nonce: String(share.nonce || '').toLowerCase(),
  };
}

should_recalc_share(res) {
  if (!res || typeof res !== 'object') return false;
  const reason = typeof res.reason === 'string' ? res.reason.toLowerCase() : '';
  if (reason.includes('pool_reject') || reason.includes('invalid_share') || reason.includes('stale') || reason.includes('job')) {
    return true;
  }
  if (!Array.isArray(res.rejects)) return false;
  return res.rejects.some((entry) => {
    if (!entry) return false;
    const txt = typeof entry === 'string'
      ? entry.toLowerCase()
      : JSON.stringify(entry).toLowerCase();
    return txt.includes('invalid') || txt.includes('stale') || txt.includes('low') || txt.includes('job');
  });
}

async challenge(message_hash) {
  if (!this.connection) return null;
  active_pow_tasks++;
  try {
    const start = Date.now();
    const shares = [];
    const allShares = [];
    const selected_nonces = new Set();
    const all_nonces = new Set();

    while (Date.now() - start < POW_MAX_JOB_TIME_MS && shares.length < POW_REQUIRED_SHARES) {
      let job = null;
      if (!job) {
        const jobResponse = await this.request_job();
        if (jobResponse && jobResponse.job) {
          this.set_job(jobResponse.job);
          job = this.currentJob;
        }
      }
      if (!job) {
        await sleep(250);
        continue;
      }

      const prevId = extractPrevIdFromBlob(job.blob);
      const fresh =
        !!prevId &&
        !!this.currentPrevId &&
        (prevId === this.currentPrevId ||
          prevId === this.previousPrevId ||
          prevId === this.twoBackPrevId);

      if (!fresh) {
        logPow('pow_stale_local', { jobId: job.job_id });
        const refreshed = await this.request_job();
        if (refreshed && refreshed.job) {
          this.set_job(refreshed.job);
        }
        await sleep(250);
        continue;
      }

      const elapsed_ms = Date.now() - start;
      const { hashes_per_second, time_budget_ms, in_phase1 } = pow_rate_policy(
        active_pow_tasks,
        elapsed_ms,
      );

      let share = null;
      try {
        share = await this.pow_backend.find_share({
          job,
          hashes_per_second,
          time_budget_ms,
          nonce_tag_bits: 0,
          nonce_tag_value: 0,
        });
      } catch (e) {
        if (e && e.message === 'pow_worker_timeout') {
          logPow('pow_worker_timeout_retry', {
            jobId: job.job_id,
            sliceMs: time_budget_ms,
            hps: hashes_per_second,
            nonceTagValue: nonce_tag_value,
          });
          await sleep(in_phase1 ? 100 : 300);
          continue;
        }
        throw e;
      }

      if (share && typeof share.nonce === 'string' && typeof share.result === 'string') {
        const normalized = {
          job_id: String(share.job_id),
          nonce: share.nonce.toLowerCase(),
          result: share.result.toLowerCase(),
        };
        if (!all_nonces.has(normalized.nonce)) {
          all_nonces.add(normalized.nonce);
          allShares.push(normalized);
        }
        if (!selected_nonces.has(normalized.nonce)) {
          selected_nonces.add(normalized.nonce);
          logPow('pow_share_found_local', { jobId: job.job_id, nonce: normalized.nonce });
          shares.push(normalized);
        }
      }

      if (shares.length >= POW_REQUIRED_SHARES) {
        return { job, shares, allShares };
      }

      await sleep(in_phase1 ? 50 : 250);
    }

    return null;
  } finally {
    active_pow_tasks = Math.max(0, active_pow_tasks - 1);
  }
}


parse(d) {
  try{
    return JSON.parse(d)
  } catch(e) {
    return false
  }
}

close() {
  if (!this.connection) return;
  this.connection.end();
  this.connection = null
}

async send_pow_packet({
  request_id,
  message_hash,
  auth_context,
  build_payload,
  log_prefix,
  exception_reason,
}) {
  try {

    let i = 0;

    while (!this.connection && i < 5) {
      this.reconnect();
      await sleep(5000);
      console.log('Reconnecting to node...', this.connection)
      i++;
    }

    if (!this.connection) return { success: false, reason: 'No connection' };

    const max_attempts = 3;

    const should_retry = (res) => {
      if (!res) return true;
      if (res.success === true) return false;
      return !!res.reason;
    };
    const send_packet = async (packet) => {
      if (!this.connection) {
        this.reconnect();
        await sleep(5000);
      }
      return await new Promise((resolve, reject) => {
        this.requests.set(request_id, { resolve, reject });
        if (!this.send_packet(packet)) {
          this.requests.delete(request_id);
          resolve({ success: false, reason: 'write_failed' });
          return;
        } 
        setTimeout(() => {
          if (!this.requests.has(request_id)) return;
          this.requests.delete(request_id);
          resolve({ success: false, reason: 'timeout' });
        }, 60000);
      });
    };

    const compute_pow = async () => {
      let pow = null;
      try {
        pow = await this.challenge(message_hash);
        if (pow && pow.shares) {
          logPow(`${log_prefix}_ready`, { jobId: pow.job && pow.job.job_id, shares: pow.shares.length });
        }
      } catch (e) {
        logPow('pow_error', { message: e && e.message });
      }
      return pow;
    };

    let last_res = { success: false, reason: 'unknown' };
    let stale_share_retries = 0;
    const max_stale_share_retries = 3;
    for (let attempt = 1; attempt <= max_attempts; attempt++) {
      let pow = await compute_pow();
      if (!pow || !pow.shares || pow.shares.length === 0) {
        logPow(`${log_prefix}_retry`, { attempt, reason: 'no_shares' });
        this.currentJob = null;
        const jobResponse = await this.request_job();
        if (jobResponse && jobResponse.job) this.set_job(jobResponse.job);
        last_res = { success: false, reason: 'PoW required' };
        continue;
      }

      const auth = this.build_pow_auth(message_hash, request_id, pow.shares, auth_context);
      if (!auth) {
        logPow(`${log_prefix}_retry`, { attempt, reason: 'pow_auth_failed' });
        await sleep(100);
        continue;
      }
      const res = await send_packet(build_payload({ ...pow, auth }));
      if (res && res.success === true) return res;

      last_res = res || { success: false, reason: 'unknown' };
      if (!should_retry(last_res)) break;

      const recalc = this.should_recalc_share(last_res);
      if (recalc && stale_share_retries < max_stale_share_retries) {
        stale_share_retries++;
        logPow(`${log_prefix}_recalc`, {
          attempt,
          stale_share_retries,
          reason: last_res.reason,
          jobId: pow && pow.job && pow.job.job_id,
        });
        // Do not consume a main attempt for stale/invalid-share churn.
        attempt--;
      }

      logPow(`${log_prefix}_retry`, { attempt, reason: last_res.reason, jobId: pow && pow.job && pow.job.job_id });
      this.currentJob = null;
      const jobResponse = await this.request_job();
      if (jobResponse && jobResponse.job) this.set_job(jobResponse.job);
      await sleep(recalc ? 25 : 100);
    }
    return last_res;
  } catch (e) {
    logPow(`${log_prefix}_error`, { message: e && e.message });
    return { success: false, reason: exception_reason || 'pow_packet_exception' };
  }
}

async message(payload, hash, viewtag, kind = 'dm') {
  const request_id = Date.now();
  const baseMessage = {
    cipher: payload,
    timestamp: request_id,
    hash,
    id: request_id,
    push: true,
    viewtag,
    kind,
  };

  return await this.send_pow_packet({
    request_id,
    message_hash: hash,
    auth_context: kind ? `${kind}:${String(baseMessage.cipher || '')}` : String(baseMessage.cipher || ''),
    log_prefix: 'pow_message',
    exception_reason: 'message_exception',
    build_payload: (pow) => ({
      type: 'post',
      message: {
        ...baseMessage,
        pow: {
          version: 2,
          job: pow.job,
          shares: pow.shares,
          auth: pow.auth,
        },
      },
    }),
  });
}

async register(data) {
  const request_id = Date.now();
  const message_hash = random_key().toString('hex');

  return await this.send_pow_packet({
    request_id,
    message_hash,
    auth_context: String(data || ''),
    log_prefix: 'pow_register',
    exception_reason: 'register_exception',
    build_payload: (pow) => ({
      register: true,
      data,
      timestamp: request_id,
      id: request_id,
      hash: message_hash,
      pow: {
        version: 2,
        job: pow.job,
        shares: pow.shares,
        auth: pow.auth,
      },
    }),
  });
}


}
const Nodes = new NodeConnection()

class Room {
  constructor(beam) {
    this.swarm = {};
    this.time = Date.now();
    this.topic = null;
    this.discovery = null;
    this.beam = beam;
  }

  async join(hashkey) {
    //Create a new common keypair for this room from hashed invitelink as seed.
    //The public key of this keypair is used as topic.
    //Connections auth is checked by a signature from the privatekey.
    const invite = toUintArray(hashkey);
    const [base_keys, dht_keys, sig] = get_new_peer_keys(invite);
    const topic = base_keys.publicKey.toString('hex');
    const hash = Buffer.alloc(32).fill(topic);
    try {
      await Storage.load_drive(topic);
    } catch (e) {
      console.log('Error:', e);
    }

    console.log('Joining room....');
    try {
      this.swarm = new HyperSwarm(
        { },
        sig,
        dht_keys,
        base_keys,
      );
    } catch (e) {
      error_message('Error starting swarm');
      return;
    }
    this.swarm.on('connection', (connection, information) => {
      try {
        new_connection(
          connection,
          topic,
          this.key,
          dht_keys,
          information,
          this.beam,
        );
      } catch (error) {
        console.log('Failed to initialize swarm connection', error);
        connection_closed(connection, topic, 'Swarm on connection init error');
      }
    });

    this.discovery = this.swarm.join(hash, { client: true, server: true });
    this.topic = topic;
    return true;
  }
}

async function idle(background, force) {

  if (force) {
    close_all_connections();
    for (const room of active_swarms) {
      room.swarm.suspend();
    }
    Nodes.close();
    Nodes.node?.suspend();
    return;
  }
  if (Hugin.idle() && background) {

    if (idletimer) return;
    idletimer = setTimeout(() => {

      close_all_connections();
      for (const room of active_swarms) {
        room.swarm.suspend();
      }  
      Nodes.close();
      Nodes.node?.suspend();
      idletimer = null;
    }, 10*1000)
    return;
  };

  if (Hugin.idle()) return;
  if (idletimer) {
    clearTimeout(idletimer);
    idletimer = null;
  }
  if (Date.now() - last_activity < 2000) return;
  if (Date.now() - last_activity > 2000) {
    for (const room of active_swarms) {
      // room.swarm.suspend();
      await room.swarm.resume();
      room.discovery.refresh({client: true, server: true});
    }  
    Nodes.node?.resume();
    Nodes.reconnect();
  };
}
const create_swarm = async (hashkey, key, beam = false, chat = false) => {
  const room = new Room(beam);
  const connected = await room.join(hashkey);
  if (!connected) return;
  const admin = is_admin(key);
  const files = await Storage.load_meta(room.topic);

  Hugin.send('peer-connected', {
    joined: {
      name: Hugin.name,
      address: Hugin.address,
      key,
      avatar: Hugin.avatar,
    },
  });

  const active = {
    call: [],
    connections: [],
    channels: [],
    voice_channel: [],
    key,
    swarm: room.swarm,
    time: room.time,
    topic: room.topic,
    discovery: room.discovery,
    admin: admin ? true : false,
    search: false,
    buffer: [],
    peers: [],
    requests: 0,
    files,
    beam,
    chat,
  };

  active_swarms.push(active);

  Hugin.send('new-swarm', { connected, key, admin, chat, beam });

  check_if_online(room.topic);

  process.once('SIGINT', function () {
    room.swarm.on('close', function () {
      process.exit();
    });
    room.swarm.destroy();
    setTimeout(() => process.exit(), 2000);
  });

  return room.topic;
};

const new_connection = (connection, topic, key, dht_keys, peer, beam) => {
  console.log('New connection incoming');
  let active = get_active_topic(topic);

  if (!active) {
    console.log('no longer active in topic');
    connection_closed(connection, topic, 'New connection error');
    return;
  }

  console.log('*********Got new Connection! ************');
  const incomingPublicKey = peer.publicKey.toString('hex');
  const duplicateByPublicKey = active.connections.find(
    (a) => a.connection !== connection && a.publicKey === incomingPublicKey,
  );
  if (duplicateByPublicKey) {
    // Keep an already-joined healthy connection, otherwise replace stale duplicates.
    if (duplicateByPublicKey.joined && is_connection_healthy(duplicateByPublicKey.connection)) {
      try {
        connection.end();
        connection.destroy();
      } catch (e) {}
      return;
    }
    connection_closed(duplicateByPublicKey.connection, topic, 'Duplicate public key');
  }

  const connEntry = {
    address: '',
    connection,
    name: '',
    topic,
    video: false,
    voice: false,
    knownHashes: [],
    peer,
    request: true,
    publicKey: incomingPublicKey,
    driveKey: null,
    msgType: null,
    write(data) {
      const str = typeof data === 'string' ? data : JSON.stringify(data);
      if (this.msgType) {
        try { this.msgType.send(str); } catch (e) {}
      } else {
        try { this.connection.write(str); } catch (e) {}
      }
    },
  };

  active.connections.push(connEntry);

  const mux = Protomux.from(connection);
  const channel = mux.createChannel({ protocol: 'hugin-messages' });
  const msgType = channel.addMessage({
    encoding: c.string,
    onmessage: async (data) => {
      try {
        await incoming_message(data, topic, connection, peer, beam);
      } catch (error) {
        console.log('Incoming message handler failed', error);
        connection_closed(connection, topic, 'Incoming message error');
      }
    },
  });
  channel.open();
  connEntry.msgType = msgType;

  Storage.replicate(connection, topic);
  send_joined_message(topic, dht_keys, connection).catch((error) => {
    console.log('Failed to send joined message', error);
    connection_closed(connection, topic, 'Joined message error');
  });

  connection.on('close', () => {
    console.log('Got close signal');
    connection_closed(connection, topic, 'Connection on close');
  });

  connection.on('error', (e) => {
    if (is_timeout_error(e)) {
      console.log('Connection timed out, closing peer connection');
    } else {
      console.log('Got error connection signal', e);
    }
    connection_closed(connection, topic, 'Connection on error');
  });
};

async function send_dm_message(address, payload) {
  const active = get_beam(address);
  if (!active) return;
  send_swarm_message(payload, active.topic);
}

function send_message(hash, message, topic, reply, invite, tip = false) {
  const message_json = {
    hash,
    room: invite,
    address: Hugin.address,
    message: message,
    name: Hugin.name,
    reply: reply,
    signature: 'sig',
    timestamp: Date.now(),
    tip, // {amount, sender, receiver, hash}
  };

  const send = JSON.stringify(message_json);
  send_swarm_message(send, topic);
  return message_json;
}

const is_admin = (key) => {
  return Hugin.rooms.find((a) => a.key === key && a.admin)?.admin;
};

const get_beam = (address) => {
  for (const a of active_swarms) {
    if (!a.beam) continue;
    if (a.chat === address) return a;
  }
};

const send_joined_message = async (topic, dht_keys, connection) => {
  //Use topic as signed message?
  const msg = topic;
  const active = get_active_topic(topic);
  if (!active) {
    return;
  }

  const admin = is_admin(active.key);
  let sig = '';
  if (admin) {
    sig = sign_admin_message(dht_keys, admin);
  }
  let [voice, video, audioMute, videoMute, screenshare] =
    get_local_voice_status(topic);
  if (video) {
    voice = true;
  }

  const signature = await sign(dht_keys.get().publicKey.toString('hex'));
  const messages = active.beam ? [] : await Hugin.request({ type: 'get-room-history', key: active.key });

  const data = JSON.stringify({
    address: Hugin.address,
    channels: [],
    joined: true,
    message: msg,
    name: Hugin.name,
    avatar: Hugin.avatar,
    signature: sig.toString('hex'),
    time: active.time,
    topic: topic,
    video: video,
    voice: voice,
    idSig: signature,
    audioMute,
    videoMute,
    screenshare,
    messages,
    driveKey: Storage.get_drive_key(topic),
  });

  const con = active.connections.find((a) => a.connection === connection);
  if (con) {
    con.write(data);
  } else {
    try { connection.write(data); } catch (error) {}
  }
};

const send_swarm_message = (message, topic) => {
  const active = get_active_topic(topic);
  if (!active) {
    return;
  }
  //Buffer any non sent messages if connection was lost.
  if (active.connections.length === 0) {
    active.buffer.push(message);
    return;
  }
  for (const chat of active.connections) {
    try {
      console.log('Writing to channel');
      if (!chat.joined) continue;
      chat.write(message);
    } catch (e) {
      continue;
    }
  }
  console.log('Swarm msg sent!');
};

const incoming_message = async (data, topic, connection, peer, beam) => {
  last_activity = Date.now();
  const str = data.toString();
  
  // Check
  const check = await check_data_message(str, connection, topic, peer, beam);
  if (check === 'Ban') {
    console.log('Banned connection');
    peer.ban(true);
    connection_closed(connection, topic, 'Connection banned');
    return;
  }
  if (check === 'Error') {
    // connection_closed(connection, topic, 'Connection Error check');
    console.log('Incoming message error', data, topic, beam);
    return;
  }

  if (check) return;

  if (beam) {
    const hash = str.substring(0, 64);
    console.log('beam-message fired 🔥🔥 🔥')
    Hugin.send('beam-message', { message: str, hash, background: Hugin.background });
    return;
  }
  const message = sanitize_group_message(JSON.parse(str));
  if (!message) return;
  message.background = Hugin.background;
  Hugin.send('swarm-message', { message, topic });
};

const check_data_message = async (data, connection, topic, peer, beam) => {
  try {
    data = JSON.parse(data);
  } catch (e) {
    if (beam) return false;
    return 'Ban';
  }

  //Check if active in this topic
  const active = get_active_topic(topic);
  if (!active) {
    return 'Error';
  }

  //Check if this connection is still in our list
  const con = active.connections.find((a) => a.connection === connection);
  if (!con) {
    return 'Error';
  }

  // If feed message
  if ('type' in data) {
    if (data.type === 'feed') {
      console.log('feed data log: ', data);
      Hugin.send('feed-message', {data});
    }
  }

  //If the connections send us disconnect message, return. **todo double check closed connection
  if ('type' in data) {
    if (data.type === 'disconnected') {
      connection_closed(connection, active.topic, 'Disconnected');
      return true;
    }
  }

  if ('typing' in data) {
    console.log('Typing..');
    const [typing, checked] = sanitize_typing_message(data)
    if (!checked) return
    if (!con.address) return
    const datas = {typing, key: beam ? con.address : active.key, address: con.address};
    Hugin.send('typing', {datas})
  }
  

  if ('info' in data) {
    const fileData = sanitize_file_message(data);
    console.log('Got file data incoming', fileData);
    if (!fileData) return 'Ban';
    check_file_message(fileData, topic, con.address, con.name, beam, con.driveKey);
    return true;
  }

  //Double check if connection is joined voice?
  if ('offer' in data) {
    //Check if this connection has voice status activated.
    if (
      active.connections.some(
        (a) => a.connection === connection && a.voice === true,
      )
    ) {
      const [voice, video] = get_local_voice_status(topic);
      if ((!voice && !video) || !voice) {
        //We are not connected to a voice channel
        //Return true bc we do not need to check it again
        return true;
      }

      //There are too many in the voice call
      const users = active.connections.filter((a) => a.voice === true);
      if (users.length > 9) return true;

      //Joining == offer
      if (data.offer === true) {
        if ('retry' in data) {
          if (data.retry === true) {
            Hugin.send('got-expanded-voice-channel', { data });
            return;
          }
        }
        answer_call(data);
      } else {
        got_answer(data);
      }
    }
    return true;
  }

  if (typeof data === 'object') {
    if ('joined' in data) {
      const joined = sanitize_join_swarm_data(data);
      console.log('joined the lobby', joined?.name);
      if (!joined) {
        return 'Ban';
      }

      // if (con.joined) {
      //   //Connection is already joined
      //   return true;
      // }

      if (Hugin.banned(data.address, topic)) {
        if (active.admin) admin_ban_user(data.address, active.key);
        else ban_user(data.address, topic);
      }

      const admin = verify_signature(
        connection.remotePublicKey,
        Buffer.from(data.signature, 'hex'),
        Buffer.from(active.key.slice(-64), 'hex'),
      );

      const verified = await Hugin.request({
        type: 'verify-signature',
        data: {
          message: connection.remotePublicKey.toString('hex'),
          address: joined.address,
          signature: joined.idSig,
        },
      });

      if (!verified) return 'Ban';

      peer.priority = 3;

      con.joined = true;
      con.address = joined.address;
      con.name = joined.name;
      con.voice = joined.voice;
      con.admin = admin;
      con.video = joined.video;
      joined.key = active.key;
      con.request = true;
      if (joined.driveKey) {
        con.driveKey = joined.driveKey;
        Storage.add_peer_drive(topic, joined.driveKey, active.key, beam);
      }
      close_duplicate_peer_connections(
        active,
        con.connection,
        (entry) => !!entry.address && entry.address === joined.address,
        topic,
        'Duplicate address',
      );
      active.peers.push(peer.publicKey.toString('hex'));
      let uniq = {};
      const peers = active.peers.filter(
        (obj) => !uniq[obj] && (uniq[obj] = true),
      );
      active.peers = peers;
      
      const time = parseInt(joined.time);

      if (!active.beam) {
        process_request(joined.messages, active.key)

        //Request message history from peer connected before us.
        if (parseInt(active.time) > time && active.requests < 1) {
          request_history(joined.address, topic, active.files);
          active.requests++;
        }
        if (!feed_requests.some(a => a.address == joined.address)) {
          console.log('Adding',joined.address,'to feed sync queue');
          feed_requests.push({address: joined.address, topic });
        }

        if (!feed_requests_started) {
          feed_request_process();
        }
      }

      //Send any buffered messages if connection was lost.
      // if (parseInt(active.time) < time && active.buffer.length) {
      //   send_history(joined.address, topic, active.key);
      //   active.buffer = [];
      // }

      Hugin.send('peer-connected', { joined, beam: active.beam });

      //If our new connection is also in voice, check who was connected first to decide who creates the offer
      const [in_voice, video] = get_local_voice_status(topic);
      if (con.voice && in_voice && parseInt(active.time) > time) {
        await sleep(2000);
        try {
          join_voice_channel(active.key, topic, joined.address);
        } catch (e) {
          console.error('Failed to join voice channel!', e);
        }
      }

      console.log('Connection updated: Joined:', con.name);
      return true;
    }
  }
  if ('voice' in data) {
    const voice_status = check_peer_voice_status(data, con);
    if (!voice_status) {
      return 'Ban';
    }
    return true;
  }

  if (!con.joined) return true

  if ('type' in data) {
    if (data.type === 'ban') {
      if (data.address === Hugin.address && con.admin) {
        Hugin.send('banned', active.key);
        Hugin.send('remove-room', active.key);
        await sleep(777);
        end_swarm(topic);
        return;
      }
      if (con.admin) ban_user(data.address, topic);
      else return 'Error';
      return true;
    } else {
      //Dont handle requests from blocked users
      if (Hugin.blocked(con.address)) return true;
      // History requests

      if (data.type === REQUEST_FEED) {
        console.log('Got feed request');
        send_feed_history(con.address, topic);
        return true;
      }

      if (data.type === SEND_FEED_HISTORY) {
        pending_feed_requests.delete(con.address);
        save_feed_history(data.messages, con.address, topic);
        console.log('Saving feed history from', con.address);
        return true;
      }

      //Start-up history sync
      if (data.type === REQUEST_HISTORY && con.request) {
        send_history(con.address, topic, active.key, active.files);
        return true;
      } else if (data.type === SEND_HISTORY && con.request) {
        console.log('Got message history from some cool guise');
        // process_request(data.messages, active.key);
        if ('files' in data) {
          console.log('Got some files', data.files);
          process_files(data, active, con, topic);
        }
        con.request = false;
        return true;
      }

      //Live syncing from other peers who might have connections to others not established yet by us.

      const INC_HASHES = data.hashes?.length !== undefined || 0;
      const INC_MESSAGES = data.messages?.length !== undefined || 0;
      const INC_PEERS = data.peers?.length !== undefined || 0;
      //Check if payload is too big
      if (INC_HASHES) {
        if (data.hashes?.length > 25) return 'Ban';
      }

      if (data.type === PING_SYNC && active.search && INC_HASHES) {
        if ('files' in data && !beam) {
          process_files(data, active, con, topic);
        }

        if (con.knownHashes.toString() === data.hashes.toString()) {
          //Already know all the latest messages
          con.request = false;
          return true;
        }
        if (INC_PEERS && active.peers !== data?.peers) {
          if (data.peers?.length > 100) return 'Ban';
          find_missing_peers(active, data?.peers);
        }

        const missing = await check_missed_messages(
          data.hashes,
          con.address,
          topic,
        );
        con.knownHashes = data.hashes;
        if (!missing) return true;
        con.request = true;
        active.search = false;
        request_missed_messages(missing, con.address, topic);
        //Updated knownHashes from this connection
      } else if (data.type === REQUEST_MESSAGES && INC_HASHES) {
        send_missing_messages(data.hashes, con.address, topic);
      } else if (
        data.type === MISSING_MESSAGES &&
        INC_MESSAGES &&
        con.request
      ) {
        active.search = false;
        con.request = false;
        process_request(data.messages, active.key);
      } else if (data.type === REQUEST_FILE) {
        const file = sanitize_file_message(data.file);
        if (!file) return 'Error';
        await Storage.start_beam(
          true,
          file.key,
          file,
          topic,
          con.name,
          active.key,
          beam,
        );
      }
      return true;
    }
  }
  //Dont display messages from blocked users
  if (Hugin.blocked(con.address)) return;

  if (data.type === PING_SYNC) return true;

  return false;
};

const find_missing_peers = async (active, peers) => {
  for (const peer of peers) {
    if (typeof peer !== 'string' || peer?.length !== 64) continue;
    if (!active.peers.some((a) => a === peer)) {
      console.log("'''''''''''''''''''''''''''''''");
      console.log('Try connect to peer ------------>');
      console.log("'''''''''''''''''''''''''''''''");
      active.swarm.joinPeer(Buffer.from(peer, 'hex'));
      await sleep(100);
    }
  }
};

const check_missed_messages = async (hashes) => {
  console.log('Checking for missing messages');
  const missing = [];
  for (const hash of hashes) {
    if (!check_hash(hash)) continue;
    if (await room_message_exists(hash)) continue;
    missing.push(hash);
  }

  if (missing.length > 0) {
    console.log('Requesting:', missing.length, ' missed messages');
    return missing;
  }
  console.log('Current state synced.');
  return false;
};

const request_missed_messages = (hashes, address, topic) => {
  const message = {
    type: REQUEST_MESSAGES,
    hashes,
  };
  send_peer_message(address, topic, message);
};

const send_missing_messages = async (hashes, address, topic) => {
  const messages = [];
  for (const hash of hashes) {
    if (!check_hash(hash)) continue;
    const found = await Hugin.request({ type: 'get-room-message', hash });
    if (found) messages.push(found);
  }
  if (messages.length > 0) {
    const message = {
      type: MISSING_MESSAGES,
      messages,
    };
    send_peer_message(address, topic, message);
  }
};

const request_history = (address, topic, files) => {
  console.log('Reqeust history from another peer');
  const message = {
    type: REQUEST_HISTORY,
    files,
  };
  send_peer_message(address, topic, message);
};

const request_feed = (address, topic) => {
  console.log('Requsting feed..');
  const message = {
    type: REQUEST_FEED
  };
  send_peer_message(address, topic, message);
}

const send_history = async (address, topic, key, files) => {
  const messages = await Hugin.request({ type: 'get-room-history', key });
  console.log('Sending:', messages.length, 'messages');
  const history = {
    type: SEND_HISTORY,
    messages,
    files,
  };
  send_peer_message(address, topic, history);
};

const send_feed_history = async (address, topic) => {
  const messages = await Hugin.request({ type: 'get-feed-history'});
  const history = {
    type: SEND_FEED_HISTORY,
    messages
  };
  send_peer_message(address, topic, history);
}

const save_feed_history = async (messages, address, topic) => {
  console.log('Saving feed history: ', messages);
  for (const data of messages) {
    Hugin.send('feed-message', { data });
  }
}

const request_file = async (address, topic, file, room, dm = false) => {
  //request a missing file, open a hugin beam
  console.log('-----------------------------');
  console.log('*** WANT TO REQUEST FILE  ***');
  console.log('-----------------------------');
  const verify = await Hugin.request({
    type: 'verify-signature',
    data: {
      message:
        file.hash + file.size.toString() + file.time.toString() + file.fileName,
      address: file.address,
      signature: file.signature,
    },
  });
  if (!verify) return;
  const key = random_key().toString('hex');
  await Storage.start_beam(false, key, file, topic, room, dm);
  file.key = key;
  const message = {
    file,
    type: REQUEST_FILE,
  };
  await sleep(200);
  send_peer_message(address, topic, message);
};

const process_files = async (data, active, con, topic) => {
  if (!Array.isArray(data.files)) return 'Ban';
  if (data.files.length > 10) return 'Ban';
  for (const file of data.files) {
    const old = (Date.now() - file.time) > ONE_DAY
    if (old) continue
    if (Hugin.files.some((a) => a === file.hash)) continue;
    if (!check_hash(file.hash)) continue;
    const [isMedia] = check_if_media(file.fileName, file.size);
    await sleep(50);
    if (isMedia && Hugin.syncImages) {
      request_file(con.address, topic, file, active.key);
      continue;
    }
    if (!con.driveKey) continue;
    const fromAddr = file.address || con.address;
    const remoteFile = {
      fileName: file.fileName,
      address: fromAddr,
      size: file.size,
      topic,
      key: active.key,
      chat: fromAddr,
      hash: file.hash,
      name: file.name || con.name,
      time: file.time,
      driveKey: con.driveKey,
    };
    Hugin.send('room-remote-file-added', { chat: active.key, remoteFiles: [remoteFile] });
    save_file_info(file, topic, fromAddr, file.time, false, con.name);
  }
};

const process_request = async (messages, key) => {
  let i = 0;
  try {
    for (const m of messages.reverse()) {
      i++;
      if (m?.address === Hugin.address) continue;
      if (m?.hash?.length !== 64) continue;
      const message = sanitize_group_message(m);
      if (!message) continue;
      //Save room message in background mode ??   
      message.history = true;
      if (messages.length === i) message.history = false;
      message.background = Hugin.background;
      Hugin.send('swarm-message', { message });
    }
    //Trigger update when all messages are synced? here.
    Hugin.send('history-update', { key, i, background: Hugin.background });
  } catch (e) {
    console.log('error processing history', e);
  }
};

const save_file_info = (data, topic, address, time, sent, name) => {
  const active = get_active_topic(topic);
  const message = {
    message: data.fileName,
    address: address,
    name: name,
    timestamp: time,
    room: active.key,
    hash: data.hash,
    reply: '',
    sent: sent,
    file: {
      fileName: data.fileName,
      hash: data.hash,
      timestamp: time,
      sent: sent,
      path: '',
      image: false,
      topic,
      type: 'file',
    },
  };
  Hugin.send('swarm-message', { message });
};

const check_file_message = async (data, topic, address, name, dm, driveKey = null) => {
  const active = get_active_topic(topic);
  if (!active) return;

  if (data.info === 'file-shared') {
    const [isMedia] = check_if_media(data.fileName, data.size);
    const autoSync = driveKey && isMedia && (Hugin.syncImages || dm);

    if (autoSync) {
      // Watcher in storage.js handles download; file-downloaded → rpc.js creates the
      // message with full FileInfo after download completes. Nothing shown until then.
      return;
    }

    // Non-auto-sync: show a download button.
    // Send room-remote-file-added FIRST so remoteRoomFiles store is populated before
    // the swarm-message arrives; MessageItem then finds pendingRemoteFile and shows
    // the button instead of plain text.
    const remoteFile = {
      fileName: data.fileName,
      address,
      size: data.size,
      topic,
      key: dm ? address : active.key,
      chat: address,
      hash: data.hash,
      name,
      time: data.time,
      driveKey,
    };
    if (dm) {
      Hugin.send('remote-dm-file-added', { chat: address, remoteFiles: [remoteFile] });
    } else {
      Hugin.send('room-remote-file-added', { chat: active.key, remoteFiles: [remoteFile] });
      // Create the chat message so the download button has something to render on
      save_file_info(data, topic, address, data.time, false, name);
    }
  }

  if (data.type === 'file-removed') console.log("'file removed", data);
};

const send_dm_file = async (address, file) => {
  const active = get_beam(address);
  if (!active) return;
  share_file_info(file, active.topic, true, address);
}

const share_file_info = async (file, topic, dm=false, conversation='') => {
  // Note file includes property "message", regular text message
  const active = get_active_topic(topic);
  const hash = random_key().toString('hex');
  const signature = await sign(
    hash + file.size.toString() + file.time.toString() + file.fileName,
  );
  const fileInfo = {
    address: Hugin.address,
    fileName: file.fileName,
    name: Hugin.name,
    hash,
    info: 'file-shared',
    size: file.size,
    time: file.time,
    topic: topic,
    type: 'file',
    signature,
  };

  Hugin.files.push(hash);
  //Put the shared file in to our local storage
  await Storage.save(
    topic,
    Hugin.address,
    Hugin.name,
    fileInfo.hash,
    fileInfo.size,
    fileInfo.time,
    fileInfo.fileName,
    file.path,
    signature,
    'file-shared',
    'file',
  );
  const [media, type] = check_if_media(file.fileName, file.size);

  const message = {
    address: Hugin.address,
    name: Hugin.name,
    message: file.fileName,
    hash: fileInfo.hash,
    timestamp: file.time,
    room: active.key,
    reply: '',
    sent: true,
    history: false,
    file: {
      path: file.path,
      fileName: file.fileName,
      timestamp: file.time,
      hash: fileInfo.hash,
      sent: true,
      image: media,
      type: type,
    },
  };

  //Send our file info to front end as message
  if (dm) {
    message.conversation = conversation;
    Hugin.send('dm-file', { message });  
  } else {
    Hugin.send('swarm-message', { message });
  }
  const info = JSON.stringify(fileInfo);
  file.topic = topic;
  localFiles.push(file);
  //File shared, send info to peers
  send_swarm_message(info, topic);
};

const request_download = (download) => {
  const active = get_active_topic(download.key);
  const address = download.chat;
  const topic = active.topic;
  const info = {
    fileName: download.fileName,
    address: Hugin.address,
    topic: topic,
    info: 'file',
    type: 'download-request',
    size: download.size,
    time: download.time,
    key: download.key,
  };
  send_peer_message(address, topic, info);
};

const download_file = (download) => {
  if (!download.driveKey) return;
  const active = active_swarms.find((a) => a.key === download.key || a.topic === download.topic);
  if (!active) return;
  const isDm = !!active.beam;
  Storage.save_from_peer(active.topic, download, download.driveKey, active.key, isDm);
};

const start_upload = async (file, topic) => {
  const sendFile = localFiles.find(
    (a) => a.fileName === file.fileName && file.topic === topic,
  );
  console.log('Start uploading this file:', sendFile);
  if (!sendFile) {
    errorMessage('File not found');
    return;
  }
  return await upload_ready(sendFile, topic, file.address);
};

const upload_ready = async (file, topic, address) => {
  const beam_key = await add_local_file(
    file.fileName,
    file.path,
    address,
    file.size,
    file.time,
    true,
  );
  const info = {
    fileName: file.fileName,
    address,
    topic,
    info: 'file',
    type: 'upload-ready',
    size: file.size,
    time: file.time,
    key: beam_key,
  };
  send_peer_message(address, topic, info);
  return beam_key;
};

async function send_voice_channel_sdp(data) {
  const active = active_swarms.find((a) => a.topic === data.topic);
  if (!active) return;
  const con = active.connections.find((a) => a.address === data.address);
  if (!con) return;
  //We switch data address because in this case, it is from, we can change this
  data.address = Hugin.address;
  try {
    con.write(JSON.stringify(data));
  } catch (e) {}
}

function send_sdp(data) {
  let offer = true;
  let reconnect = false;

  if ('retry' in data) {
    if (data.retry === true) reconnect = true;
  }

  if (data.type == 'answer') {
    offer = false;
  }

  if ('renegotiate' in data.data) {
    offer = false;
  }

  let sendMessage = {
    data: data.data,
    offer: offer,
    address: data.address,
    topic: data.topic,
    retry: reconnect,
  };

  send_voice_channel_sdp(sendMessage);
}

const send_typing_status = async (typing, key) => {
  const active = active_swarms.find((a) => a.key === key);
  if (!active) return;
  send_swarm_message(JSON.stringify({
    typing
  }),active.topic)
}

const send_voice_channel_status = async (joined, status, update = false) => {
  const active = active_swarms.find((a) => a.key === status.key);
  if (!active) return;
  const msg = active.topic;
  const sig = await sign(msg);
  const data = JSON.stringify({
    address: Hugin.address,
    avatar: Hugin.avatar,
    signature: sig,
    message: msg,
    voice: joined,
    topic: active.topic,
    name: Hugin.name,
    video: status.video,
    audioMute: status.audioMute,
    videoMute: status.videoMute,
    screenshare: status.screenshare,
  });
  update_local_voice_channel_status({
    topic: active.topic,
    voice: joined,
    audioMute: status.audioMute,
    videoMute: status.videoMute,
    screenshare: status.screenshare,
    video: status.video,
  });

  //Send voice channel status to others in the group
  send_swarm_message(data, active.topic);

  if (update) return;
  //If we joined the voice channel, make a call to those already announced their joined_voice_status
  if (joined) {
    //If no others active in the voice channel, return
    if (!active.connections.some((a) => a.voice === true)) return;
    //Check whos active and call them individually
    let active_voice = active.connections.filter(
      (a) => a.voice === true && a.address,
    );
    active_voice.forEach(async function (user) {
      await sleep(100);
      //Call to VoiceChannel.svelte
      join_voice_channel(status.key, active.topic, user.address);
    });
  }
};

const join_voice_channel = (key, topic, address) => {
  Hugin.send('join-voice-channel', { key, topic, address });
};

const answer_call = (data) => {
  console.log('Answer here!', data);
  Hugin.send('answer-call', { data });
};

const got_answer = (data) => {
  console.log('Got answer!');
  Hugin.send('got-answer', { data });
};

const send_peer_message = (address, topic, message) => {
  // console.log('Send peer message', message);
  const active = get_active_topic(topic);
  if (!active) {
    errorMessage('Swarm is not active');
    return;
  }
  const candidates = active.connections.filter((a) => a.address === address);
  if (!candidates.length) {
    errorMessage('Connection is closed');
    return;
  }
  const ordered = candidates.sort((a, b) => {
    const aScore = (a.joined ? 2 : 0) + (is_connection_healthy(a.connection) ? 1 : 0);
    const bScore = (b.joined ? 2 : 0) + (is_connection_healthy(b.connection) ? 1 : 0);
    return bScore - aScore;
  });
  for (const con of ordered) {
    try {
      con.write(JSON.stringify(message));
      return;
    } catch (e) {
      continue;
    }
  }
  console.error('Error writing to connection: all candidates failed');
};

const ban_connection = (conn, topic) => {
  conn.ban(true);
  connection_closed(conn, topic);
};

const connection_closed = (conn, topic, trace) => {
  console.log('Reason:', trace);
  console.log('Closing connection...');
  const active = get_active_topic(topic);
  if (!active) {
    return;
  }
  if (trace !== 'Connection on error') {
    try {
      conn.end();
      conn.destroy();
    } catch (e) {
      console.log('failed close connection');
    }
  }
  const user = active.connections.find((a) => a.connection === conn);
  if (!user) {
    return;
  }
  // Hugin.send('close-voice-channel-with-peer', user.address);
  Hugin.send('peer-disconnected', { address: user.address, key: active.key });

  const connection = active.connections.find((a) => a.connection === conn);
  const removedPeer = active.peers.filter((a) => a !== connection.publicKey);
  console.log('Removed peer', removedPeer);
  active.peers = removedPeer;
  console.log('active.peers', active.peers);
  const still_active = active.connections.filter((a) => a.connection !== conn);
  console.log('Connection closed');
  console.log('Still active:', still_active);
  active.connections = still_active;
};

const close_all_connections = () => {
  for (const swarm of active_swarms) {
    const active = get_active_topic(swarm.topic);
    if (!active) continue;
    for (const a of active.connections) {
      connection_closed(a.connection, active.topic);
    }
  }
};

const end_swarm = async (topic) => {
  const active = get_active_topic(topic);
  if (!active) {
    return;
  }
  Hugin.send('end-swarm', { topic });
  const [in_voice] = get_local_voice_status(topic);
  if (in_voice) {
    update_local_voice_channel_status(LOCAL_VOICE_STATUS_OFFLINE);
  }

  send_swarm_message(JSON.stringify({ type: 'disconnected' }), topic);

  await active.swarm.leave(Buffer.from(topic));
  await active.discovery.destroy();
  await active.swarm.destroy();
  const still_active = active_swarms.filter((a) => a.topic !== topic);
  active_swarms = still_active;
  console.log('***** Ended swarm *****');
};

const update_local_voice_channel_status = (data) => {
  const updated = data;
  active_voice_channel = updated;
  return true;
};

const check_peer_voice_status = (data, con) => {
  const voice_data = sanitize_voice_status_data(data);
  if (!voice_data) {
    return false;
  }
  const updated = update_voice_channel_status(voice_data, con);
  if (!updated) {
    return false;
  }
  return true;
};

const update_voice_channel_status = (data, con) => {
  ////Already know this status
  // if (data.voice === con.voice) {
  //   return true;
  // }
  //Just doublechecking the address
  if (data.address !== con.address) {
    return false;
  }
  //Set voice status
  con.voice = data.voice;
  con.video = data.video;
  console.log(
    'Updating voice channel status for this connection Voice, Video:',
    con.voice,
    con.video,
  );
  //Send status to front-end
  const status = get_active_topic(data.topic);
  data.room = status.key;
  Hugin.send('voice-channel-status', { data });
  return true;
};

const send_feed_message = async (message, reply, tip) => {
  const hash = random_key().toString('hex');
  const signature = await sign(message+hash);
  const payload = {type: 'feed', message, nickname: Hugin.name, address: Hugin.address, reply, tip, hash, timestamp: Date.now(), signature};
  for (const swarm of active_swarms) {
    for (const peer of swarm.connections) {
      try {
        peer.write(JSON.stringify(payload));
      } catch (e) {
        console.error('Error writing to connection:', e);
      }
    }
  }
  return payload;
}

const get_local_voice_status = (topic) => {
  const c = active_voice_channel;
  if (c.topic !== topic) return [false, false, false, false, false];
  return [c.voice, c.video, c.audioMute, c.videoMute, c.screenshare];
};

const get_active_topic = (topic) => {
  const active = active_swarms.find((a) => a.topic === topic);
  if (!active) {
    return false;
  }
  return active;
};

const is_connection_healthy = (connection) => {
  if (!connection) return false;
  if (connection.destroyed) return false;
  if (connection.writable === false) return false;
  return true;
};

const close_duplicate_peer_connections = (active, keepConnection, predicate, topic, reason) => {
  if (!active) return;
  const duplicates = active.connections.filter(
    (entry) => entry.connection !== keepConnection && predicate(entry),
  );
  for (const duplicate of duplicates) {
    connection_closed(duplicate.connection, topic, reason);
  }
};

const check_if_online = async (topic) => {
  const interval = setInterval(ping, 10 * 1000);
  let a = 0;
  async function ping() {
    //Check message state every 20seconds if idle
    if (a % 2 !== 0 && Hugin.idle()) return;
    const active = get_active_topic(topic);
    if (!active) {
      clearInterval(interval);
      return;
    }
    if (active.beam) return;
    let allFiles = [];
    try {
      allFiles = await Storage.load_meta(topic);
    } catch(e) {
      console.error('Error:', e);
    }
    active.files = allFiles.sort((a, b) => a.time - b.time).slice(-10);
    const hashes = await Hugin.request({
      type: 'get-latest-room-hashes',
      key: active.key,
    });
    {
      active.search = true;
      let i = 0;
      let peers = [];
      let files = [];
      //Send peer info on the first three pings. Then every 10 times.
      if (a < 1 || a % 10 === 0) {
        files = active.files;
        peers = active.peers;
        a++;
      }
      const data = { type: 'Ping', peers, files};
      for (const conn of active.connections) {
        data.hashes = hashes;
        if (i > 4) {
          if (i % 2 === 0) data.hashes = [];
        }
        try {
          conn.write(JSON.stringify(data));
        } catch (e) {
          console.error('Error writing to connection:', e);
        }
        i++;
      }
    }
  }
};

const admin_ban_user = async (address, key) => {
  const active = get_active(key);
  if (!active) return;
  active.connections.forEach((chat) => {
    try {
      chat.write(JSON.stringify({ type: 'ban', address }));
    } catch (e) {
      console.error('Error writing to connection:', e);
    }
  });
  await sleep(200);
  ban_user(address, active.topic);
};

const ban_user = async (address, topic) => {
  const active = get_active_topic(topic);
  if (!active) return;
  Hugin.ban(address, topic);
  const conn = active.connections.find((a) => a.address === address);
  if (conn) return;
  conn.peer.ban(true);
  await sleep(200);
  connection_closed(conn.connection, topic, 'Ban user');
};

const error_message = (message) => {
  Hugin.send('error-message', { message });
};

const errorMessage = (message) => {
  Hugin.send('error-message', { message });
};

module.exports = {
  create_swarm,
  end_swarm,
  send_message,
  share_file_info,
  request_download,
  download_file,
  close_all_connections,
  idle,
  send_voice_channel_status,
  send_sdp,
  send_peer_message,
  send_dm_message,
  send_dm_file,
  send_feed_message,
  send_typing_status,
  Nodes
};
