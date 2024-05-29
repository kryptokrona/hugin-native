const DHT = require('@hyperswarm/dht')
const Keychain = require('keypear')
const sodium = require('sodium-native');
const b4a = require('b4a')

function create_peer_base_keys(buf) { 
    const keypair = DHT.keyPair(buf)
    const keys = Keychain.from(keypair)
    return keys
}

function get_new_peer_keys(key) {
    const secret = Buffer.alloc(32).fill(key)
    const base_keys = create_peer_base_keys(secret)
    const random_key = randomKey()
    const dht_keys = create_peer_base_keys(random_key)
    //Sign the dht public key with our base_keys
    const signature = base_keys.get().sign(dht_keys.get().publicKey)
    return [base_keys, dht_keys, signature]
}

function randomKey() {
    let key = Buffer.alloc(32)
    sodium.randombytes_buf(key)
    console.log("random", key)
    return key
}

module.exports={get_new_peer_keys}