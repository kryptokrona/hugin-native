// Copyright (c) 2018-2020, The TurtleCoin Developers
// Copyright (c) 2019-2024, kryptokrona Developers

#include "crypto.h"
#include "Java.h"
#include "StringTools.h"
#include "hash.h"
#include "kryptokrona.h"
#include <algorithm>
#include <cstdint>
#include <cstdio>
#include <vector>

jclass WALLET_BLOCK_INFO;
jmethodID WALLET_BLOCK_INFO_CONST;
jfieldID WALLET_BLOCK_INFO_COINBASE_TRANSACTION;
jfieldID WALLET_BLOCK_INFO_TRANSACTIONS;

jclass RAW_TRANSACTION;
jmethodID RAW_TRANSACTION_CONST;
jfieldID RAW_TRANSACTION_KEY_OUTPUTS;
jfieldID RAW_TRANSACTION_HASH;
jfieldID RAW_TRANSACTION_TRANSACTION_PUBLIC_KEY;

jclass KEY_OUTPUT;
jmethodID KEY_OUTPUT_CONST;
jfieldID KEY_OUTPUT_KEY;
jfieldID KEY_OUTPUT_AMOUNT;
jfieldID KEY_OUTPUT_GLOBAL_INDEX;

jclass INPUT_MAP;
jmethodID INPUT_MAP_CONST;
jfieldID INPUT_MAP_PUBLIC_SPEND_KEY;
jfieldID INPUT_MAP_TRANSACTION_INPUT;

jclass TRANSACTION_INPUT;
jmethodID TRANSACTION_INPUT_CONST;
jfieldID TRANSACTION_INPUT_KEY_IMAGE;
jfieldID TRANSACTION_INPUT_AMOUNT;
jfieldID TRANSACTION_INPUT_TRANSACTION_INDEX;
jfieldID TRANSACTION_INPUT_GLOBAL_OUTPUT_INDEX;
jfieldID TRANSACTION_INPUT_KEY;

jclass SPEND_KEY;
jmethodID SPEND_KEY_CONST;
jfieldID SPEND_KEY_PUBLIC_KEY;
jfieldID SPEND_KEY_PRIVATE_KEY;

jclass JAVA_STRING;

void init_turtlecoin_jni(JNIEnv *env)
{
    KEY_OUTPUT = (jclass)env->NewGlobalRef(env->FindClass("com/hugin/KeyOutput"));
    KEY_OUTPUT_CONST = env->GetMethodID(KEY_OUTPUT, "<init>", "(Ljava/lang/String;JJ)V");
    KEY_OUTPUT_KEY = env->GetFieldID(KEY_OUTPUT, "key", "Ljava/lang/String;");
    KEY_OUTPUT_AMOUNT = env->GetFieldID(KEY_OUTPUT, "amount", "J");
    KEY_OUTPUT_GLOBAL_INDEX = env->GetFieldID(KEY_OUTPUT, "globalIndex", "J");

    RAW_TRANSACTION = (jclass)env->NewGlobalRef(env->FindClass("com/hugin/RawTransaction"));
    RAW_TRANSACTION_CONST = env->GetMethodID(RAW_TRANSACTION, "<init>", "([Lcom/hugin/KeyOutput;Ljava/lang/String;Ljava/lang/String;)V");
    RAW_TRANSACTION_KEY_OUTPUTS = env->GetFieldID(RAW_TRANSACTION, "keyOutputs", "[Lcom/hugin/KeyOutput;");
    RAW_TRANSACTION_HASH = env->GetFieldID(RAW_TRANSACTION, "hash", "Ljava/lang/String;");
    RAW_TRANSACTION_TRANSACTION_PUBLIC_KEY = env->GetFieldID(RAW_TRANSACTION, "transactionPublicKey", "Ljava/lang/String;");

    WALLET_BLOCK_INFO = (jclass)env->NewGlobalRef(env->FindClass("com/hugin/WalletBlockInfo"));
    WALLET_BLOCK_INFO_CONST = env->GetMethodID(WALLET_BLOCK_INFO, "<init>", "(Lcom/hugin/RawTransaction;[Lcom/hugin/RawTransaction;)V");
    WALLET_BLOCK_INFO_COINBASE_TRANSACTION = env->GetFieldID(WALLET_BLOCK_INFO, "coinbaseTransaction", "Lcom/hugin/RawTransaction;");
    WALLET_BLOCK_INFO_TRANSACTIONS = env->GetFieldID(WALLET_BLOCK_INFO, "transactions", "[Lcom/hugin/RawTransaction;");

    TRANSACTION_INPUT = (jclass)env->NewGlobalRef(env->FindClass("com/hugin/TransactionInput"));
    TRANSACTION_INPUT_CONST = env->GetMethodID(TRANSACTION_INPUT, "<init>", "(Ljava/lang/String;JJJLjava/lang/String;Ljava/lang/String;)V");
    TRANSACTION_INPUT_KEY_IMAGE = env->GetFieldID(TRANSACTION_INPUT, "keyImage", "Ljava/lang/String;");
    TRANSACTION_INPUT_AMOUNT = env->GetFieldID(TRANSACTION_INPUT, "amount", "J");
    TRANSACTION_INPUT_TRANSACTION_INDEX = env->GetFieldID(TRANSACTION_INPUT, "transactionIndex", "J");
    TRANSACTION_INPUT_GLOBAL_OUTPUT_INDEX = env->GetFieldID(TRANSACTION_INPUT, "globalOutputIndex", "J");
    TRANSACTION_INPUT_KEY = env->GetFieldID(TRANSACTION_INPUT, "key", "Ljava/lang/String;");

    SPEND_KEY = (jclass)env->NewGlobalRef(env->FindClass("com/hugin/SpendKey"));
    SPEND_KEY_CONST = env->GetMethodID(SPEND_KEY, "<init>", "(Ljava/lang/String;Ljava/lang/String;)V");
    SPEND_KEY_PUBLIC_KEY = env->GetFieldID(SPEND_KEY, "publicKey", "Ljava/lang/String;");
    SPEND_KEY_PRIVATE_KEY = env->GetFieldID(SPEND_KEY, "privateKey", "Ljava/lang/String;");

    INPUT_MAP = (jclass)env->NewGlobalRef(env->FindClass("com/hugin/InputMap"));
    INPUT_MAP_CONST = env->GetMethodID(INPUT_MAP, "<init>", "(Ljava/lang/String;Lcom/hugin/TransactionInput;)V");
    INPUT_MAP_PUBLIC_SPEND_KEY = env->GetFieldID(INPUT_MAP, "publicSpendKey", "Ljava/lang/String;");
    INPUT_MAP_TRANSACTION_INPUT = env->GetFieldID(INPUT_MAP, "input", "Lcom/hugin/TransactionInput;");

    JAVA_STRING = (jclass)env->NewGlobalRef(env->FindClass("java/lang/String"));
}

extern "C" JNIEXPORT jobject JNICALL
Java_com_hugin_TurtleCoinModule_generateDeterministicSubwalletKeysJNI(
    JNIEnv *env,
    jobject instance,
    jstring basePrivateKey,
    jlong walletIndex)
{
    std::string basePrivateKeyStr = makeNativeString(env, basePrivateKey);
    uint64_t nativeWalletIndex = static_cast<uint64_t>(walletIndex);

    std::string privateKey;
    std::string publicKey;

    bool success = Core::Cryptography::generateDeterministicSubwalletKeys(
        basePrivateKeyStr, nativeWalletIndex, privateKey, publicKey);

    if (!success)
    {
        return nullptr;
    }

    jclass keyPairClass = env->FindClass("com/hugin/KeyPair");
    jmethodID constructor = env->GetMethodID(keyPairClass, "<init>", "(Ljava/lang/String;Ljava/lang/String;)V");

    jstring jPublicKey = env->NewStringUTF(publicKey.c_str());
    jstring jPrivateKey = env->NewStringUTF(privateKey.c_str());
    jobject keyPairObject = env->NewObject(keyPairClass, constructor, jPublicKey, jPrivateKey);

    env->DeleteLocalRef(jPublicKey);
    env->DeleteLocalRef(jPrivateKey);

    return keyPairObject;
}

extern "C" JNIEXPORT jobject JNICALL
Java_com_hugin_TurtleCoinModule_generateKeysJNI(
    JNIEnv *env,
    jobject instance)
{
    std::string publicKey;
    std::string privateKey;
    Core::Cryptography::generateKeys(privateKey, publicKey);
    jclass keyPairClass = env->FindClass("com/hugin/KeyPair");
    jmethodID constructor = env->GetMethodID(keyPairClass, "<init>", "(Ljava/lang/String;Ljava/lang/String;)V");

    jstring jPublicKey = env->NewStringUTF(publicKey.c_str());
    jstring jSecretKey = env->NewStringUTF(privateKey.c_str());

    jobject keyPairObject = env->NewObject(keyPairClass, constructor, jPublicKey, jSecretKey);

    env->DeleteLocalRef(jPublicKey);
    env->DeleteLocalRef(jSecretKey);

    return keyPairObject;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_hugin_TurtleCoinModule_underivePublicKeyJNI(
    JNIEnv *env,
    jobject instance,
    jstring derivation,
    jlong index,
    jstring outputKey)
{
    std::string pub;
    std::string d = makeNativeString(env, derivation);
    std::string derived = makeNativeString(env, outputKey);

    const auto success = Core::Cryptography::underivePublicKey(d, index, derived, pub);
    if (!success)
    {
        throw std::invalid_argument("Could not underive value");
    }

    return env->NewStringUTF(pub.c_str());
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_hugin_TurtleCoinModule_hashToScalarJNI(
    JNIEnv *env,
    jobject instance,
    jstring hash)
{
    std::string h = makeNativeString(env, hash);
    const auto scalar = Core::Cryptography::hashToScalar(h);
    return env->NewStringUTF(scalar.c_str());
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_hugin_TurtleCoinModule_checkSignatureJNI(
    JNIEnv *env,
    jobject instance,
    jstring message,
    jstring publicKey,
    jstring signature)
{
    std::string m = makeNativeString(env, message);
    std::string pub = makeNativeString(env, publicKey);
    std::string sig = makeNativeString(env, signature);
    const auto checked = Core::Cryptography::checkSignature(m, pub, sig);
    return static_cast<jboolean>(checked);
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_hugin_TurtleCoinModule_generateSignatureJNI(
    JNIEnv *env,
    jobject instance,
    jstring message,
    jstring publicKey,
    jstring privateKey)
{
    std::string signable = makeNativeString(env, message);
    std::string pub = makeNativeString(env, publicKey);
    std::string priv = makeNativeString(env, privateKey);
    const auto signature = Core::Cryptography::generateSignature(signable, pub, priv);
    return env->NewStringUTF(signature.c_str());
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_hugin_TurtleCoinModule_hashToEllipticCurveJNI(
    JNIEnv *env,
    jobject instance,
    jstring hash)
{
    std::string value = makeNativeString(env, hash);
    const auto hashcurve = Core::Cryptography::hashToEllipticCurve(value);
    return env->NewStringUTF(hashcurve.c_str());
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_hugin_TurtleCoinModule_checkKeyJNI(
    JNIEnv *env,
    jobject instance,
    jstring key)
{
    std::string value = makeNativeString(env, key);
    const auto checked = Core::Cryptography::checkKey(value);
    return static_cast<jboolean>(checked);
}
extern "C" JNIEXPORT jstring JNICALL
Java_com_hugin_TurtleCoinModule_scReduce32JNI(
    JNIEnv *env,
    jobject instance,
    jstring scalar)
{
    std::string value = makeNativeString(env, scalar);
    const auto reduce = Core::Cryptography::scReduce32(value);
    return env->NewStringUTF(reduce.c_str());
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_hugin_TurtleCoinModule_secretKeyToPublicKeyJNI(
    JNIEnv *env,
    jobject instance,
    jstring jSecretKey)
{
    std::string value = makeNativeString(env, jSecretKey);
    std::string publicKey;
    Core::Cryptography::secretKeyToPublicKey(value, publicKey);
    return env->NewStringUTF(publicKey.c_str());
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_hugin_TurtleCoinModule_cnFastHashJNI(
    JNIEnv *env,
    jobject instance,
    jstring jHash)
{
    std::string value = makeNativeString(env, jHash);
    const auto hash = Core::Cryptography::cn_fast_hash(value);

    return env->NewStringUTF(hash.c_str());
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_hugin_TurtleCoinModule_cnTurtleLiteSlowHashV2JNI(
    JNIEnv *env,
    jobject instance,
    jstring jHash)
{
    std::string value = makeNativeString(env, jHash);
    const auto hash = Core::Cryptography::cn_turtle_lite_slow_hash_v2(value);

    return env->NewStringUTF(hash.c_str());
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_hugin_TurtleCoinModule_findPowShareJNI(
    JNIEnv *env,
    jobject instance,
    jstring jBlobHex,
    jstring jTargetHex,
    jlong startNonce,
    jlong maxAttempts,
    jint nonceTagBits,
    jint nonceTagValue)
{
    constexpr size_t MAX_BLOB_HEX_CHARS = 2048; // 1024 bytes
    constexpr uint64_t MAX_POW_ATTEMPTS = 5000000ULL;
    constexpr uint32_t MAX_NONCE_TAG_BITS = 16;

    const std::string blobHex = makeNativeString(env, jBlobHex);
    const std::string targetHex = makeNativeString(env, jTargetHex);

    if (blobHex.empty() || blobHex.size() > MAX_BLOB_HEX_CHARS)
    {
        return env->NewStringUTF("");
    }

    auto hexNibble = [](char c) -> int {
        if (c >= '0' && c <= '9') return c - '0';
        if (c >= 'a' && c <= 'f') return 10 + (c - 'a');
        if (c >= 'A' && c <= 'F') return 10 + (c - 'A');
        return -1;
    };

    auto hexToBytes = [&](const std::string &hex, std::vector<uint8_t> &out) -> bool {
        if (hex.size() % 2 != 0) return false;
        out.resize(hex.size() / 2);
        for (size_t i = 0; i < out.size(); i++)
        {
            const int hi = hexNibble(hex[i * 2]);
            const int lo = hexNibble(hex[(i * 2) + 1]);
            if (hi < 0 || lo < 0) return false;
            out[i] = static_cast<uint8_t>((hi << 4) | lo);
        }
        return true;
    };

    auto bytesToHex = [](const std::vector<uint8_t> &bytes) -> std::string {
        static const char *hex = "0123456789abcdef";
        std::string out;
        out.resize(bytes.size() * 2);
        for (size_t i = 0; i < bytes.size(); i++)
        {
            out[i * 2] = hex[(bytes[i] >> 4) & 0x0f];
            out[(i * 2) + 1] = hex[bytes[i] & 0x0f];
        }
        return out;
    };

    auto readVarint = [](const std::vector<uint8_t> &buffer, size_t offset, uint64_t &value, size_t &consumed) -> bool {
        value = 0;
        consumed = 0;
        int shift = 0;
        while ((offset + consumed) < buffer.size())
        {
            const uint8_t byte = buffer[offset + consumed];
            value |= static_cast<uint64_t>(byte & 0x7f) << shift;
            consumed += 1;
            if ((byte & 0x80) == 0) return true;
            shift += 7;
            if (shift > 63) return false;
        }
        return false;
    };

    auto getNonceOffset = [&](const std::vector<uint8_t> &blob) -> size_t {
        constexpr size_t fallbackOffset = 39;
        try
        {
            size_t offset = 0;
            uint64_t value = 0;
            size_t consumed = 0;
            if (!readVarint(blob, offset, value, consumed)) return fallbackOffset;
            offset += consumed;
            if (!readVarint(blob, offset, value, consumed)) return fallbackOffset;
            offset += consumed;
            if (!readVarint(blob, offset, value, consumed)) return fallbackOffset;
            offset += consumed;
            offset += 32;
            return offset;
        }
        catch (...)
        {
            return fallbackOffset;
        }
    };

    auto readUint32LE = [](const uint8_t *p) -> uint32_t {
        return (static_cast<uint32_t>(p[0]) |
                (static_cast<uint32_t>(p[1]) << 8) |
                (static_cast<uint32_t>(p[2]) << 16) |
                (static_cast<uint32_t>(p[3]) << 24));
    };

    auto readUint64LE = [&](const uint8_t *p) -> uint64_t {
        const uint64_t lo = static_cast<uint64_t>(readUint32LE(p));
        const uint64_t hi = static_cast<uint64_t>(readUint32LE(p + 4));
        return (hi << 32) | lo;
    };

    auto parseTarget = [&](const std::string &target) -> bool {
        if (target.size() != 8) return false;
        std::vector<uint8_t> targetBytes;
        if (!hexToBytes(target, targetBytes) || targetBytes.size() != 4) return false;
        const uint32_t raw = readUint32LE(targetBytes.data());
        if (raw == 0) return false;
        const uint64_t denom = 0xffffffffULL / static_cast<uint64_t>(raw);
        if (denom == 0) return false;
        return true;
    };

    auto getTargetValue = [&](const std::string &target) -> uint64_t {
        std::vector<uint8_t> targetBytes;
        if (!hexToBytes(target, targetBytes) || targetBytes.size() != 4) return 0;
        const uint32_t raw = readUint32LE(targetBytes.data());
        if (raw == 0) return 0;
        const uint64_t denom = 0xffffffffULL / static_cast<uint64_t>(raw);
        if (denom == 0) return 0;
        return 0xffffffffffffffffULL / denom;
    };

    std::vector<uint8_t> blobBytes;
    if (!hexToBytes(blobHex, blobBytes) || blobBytes.empty())
    {
        return env->NewStringUTF("");
    }

    const size_t nonceOffset = getNonceOffset(blobBytes);
    if ((nonceOffset + 4) > blobBytes.size())
    {
        return env->NewStringUTF("");
    }

    const bool hasValidTarget = parseTarget(targetHex);
    if (!hasValidTarget)
    {
        return env->NewStringUTF("");
    }
    const uint64_t targetValue = getTargetValue(targetHex);
    const uint32_t tagBits = (nonceTagBits > 0)
                                 ? std::min(static_cast<uint32_t>(nonceTagBits), MAX_NONCE_TAG_BITS)
                                 : 0;
    const uint32_t tagMask = tagBits > 0 ? ((1u << tagBits) - 1u) : 0;
    const uint32_t tagValue = static_cast<uint32_t>(nonceTagValue) & tagMask;
    const uint32_t nonceStep = tagBits > 0 ? (1u << tagBits) : 1u;

    const uint64_t requestedAttempts = maxAttempts > 0 ? static_cast<uint64_t>(maxAttempts) : 1ULL;
    const uint64_t attempts = std::min(requestedAttempts, MAX_POW_ATTEMPTS);
    const uint32_t startNonce32 = static_cast<uint32_t>(startNonce);
    uint32_t nonce = startNonce32;
    if (tagBits > 0)
    {
        // Align to first nonce that matches the message tag so each attempt hashes.
        nonce = (nonce & ~tagMask) | tagValue;
        if (nonce < startNonce32)
        {
            nonce += nonceStep;
        }
    }

    for (uint64_t i = 0; i < attempts; i++)
    {
        blobBytes[nonceOffset] = static_cast<uint8_t>(nonce & 0xff);
        blobBytes[nonceOffset + 1] = static_cast<uint8_t>((nonce >> 8) & 0xff);
        blobBytes[nonceOffset + 2] = static_cast<uint8_t>((nonce >> 16) & 0xff);
        blobBytes[nonceOffset + 3] = static_cast<uint8_t>((nonce >> 24) & 0xff);

        const std::string candidateBlobHex = bytesToHex(blobBytes);
        const std::string result = Core::Cryptography::cn_turtle_lite_slow_hash_v2(candidateBlobHex);

        std::vector<uint8_t> hashBytes;
        if (!hexToBytes(result, hashBytes) || hashBytes.size() < 32)
        {
            nonce += nonceStep;
            continue;
        }

        const uint64_t hashTail = readUint64LE(hashBytes.data() + 24);
        if (hashTail <= targetValue)
        {
            char nonceHex[9];
            snprintf(
                nonceHex,
                sizeof(nonceHex),
                "%02x%02x%02x%02x",
                static_cast<unsigned int>(blobBytes[nonceOffset]),
                static_cast<unsigned int>(blobBytes[nonceOffset + 1]),
                static_cast<unsigned int>(blobBytes[nonceOffset + 2]),
                static_cast<unsigned int>(blobBytes[nonceOffset + 3]));

            const std::string json =
                std::string("{\"job_id\":\"\",\"nonce\":\"") +
                nonceHex +
                std::string("\",\"result\":\"") +
                result +
                std::string("\"}");
            return env->NewStringUTF(json.c_str());
        }

        nonce += nonceStep;
    }

    return env->NewStringUTF("");
}

extern "C" JNIEXPORT jobjectArray JNICALL
Java_com_hugin_TurtleCoinModule_processBlockOutputsJNI(
    JNIEnv *env,
    jobject instance,
    jobject jWalletBlockInfo,
    jstring jPrivateViewKey,
    jobjectArray jSpendKeys,
    jboolean isViewWallet,
    jboolean processCoinbaseTransactions)
{
    const auto walletBlockInfo = makeNativeWalletBlockInfo(env, jWalletBlockInfo);
    const auto privateViewKey = makeNative32ByteKey<Crypto::SecretKey>(env, jPrivateViewKey);
    const auto spendKeys = makeNativeSpendKeys(env, jSpendKeys);

    const auto inputs = processBlockOutputs(
        walletBlockInfo, privateViewKey, spendKeys, isViewWallet,
        processCoinbaseTransactions);

    return makeJNIInputs(env, inputs);
}

extern "C" JNIEXPORT jobjectArray JNICALL
Java_com_hugin_TurtleCoinModule_generateRingSignaturesJNI(
    JNIEnv *env,
    jobject instance,
    jstring jPrefixHash,
    jstring jKeyImage,
    jobjectArray jPublicKeys,
    jstring jTransactionSecretKey,
    jlong realOutput)
{
    const Crypto::Hash prefixHash = makeNative32ByteKey<Crypto::Hash>(env, jPrefixHash);
    const Crypto::KeyImage keyImage = makeNative32ByteKey<Crypto::KeyImage>(env, jKeyImage);
    const std::vector<Crypto::PublicKey> publicKeys = makeNativePublicKeys(env, jPublicKeys);
    const Crypto::SecretKey transactionSecretKey = makeNative32ByteKey<Crypto::SecretKey>(env, jTransactionSecretKey);

    std::vector<Crypto::Signature> signatures;

    Crypto::crypto_funcs::generateRingSignatures(
        prefixHash, keyImage, publicKeys, transactionSecretKey, realOutput, signatures);

    return makeJNISignatures(env, signatures);
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_hugin_TurtleCoinModule_checkRingSignaturesJNI(
    JNIEnv *env,
    jobject instance,
    jstring jPrefixHash,
    jstring jKeyImage,
    jobjectArray jPublicKeys,
    jobjectArray jSignatures)
{
    const Crypto::Hash prefixHash = makeNative32ByteKey<Crypto::Hash>(env, jPrefixHash);
    const Crypto::KeyImage keyImage = makeNative32ByteKey<Crypto::KeyImage>(env, jKeyImage);
    const std::vector<Crypto::PublicKey> publicKeys = makeNativePublicKeys(env, jPublicKeys);
    const std::vector<Crypto::Signature> signatures = makeNativeSignatures(env, jSignatures);

    const auto success = Crypto::crypto_funcs::checkRingSignature(
        prefixHash, keyImage, publicKeys, signatures);

    return static_cast<jboolean>(success);
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_hugin_TurtleCoinModule_generateKeyDerivationJNI(
    JNIEnv *env,
    jobject instance,
    jstring jTransactionPublicKey,
    jstring jPrivateViewKey)
{
    const auto transactionPublicKey = makeNative32ByteKey<Crypto::PublicKey>(env, jTransactionPublicKey);
    const auto privateViewKey = makeNative32ByteKey<Crypto::SecretKey>(env, jPrivateViewKey);

    Crypto::KeyDerivation derivation;

    Crypto::crypto_funcs::generate_key_derivation(transactionPublicKey, privateViewKey, derivation);

    return makeJNI32ByteKey(env, derivation);
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_hugin_TurtleCoinModule_generateKeyImageJNI(
    JNIEnv *env,
    jobject instance,
    jstring jPublicEphemeral,
    jstring jPrivateEphemeral)
{
    const auto publicEphemeral = makeNative32ByteKey<Crypto::PublicKey>(env, jPublicEphemeral);
    const auto privateEphemeral = makeNative32ByteKey<Crypto::SecretKey>(env, jPrivateEphemeral);

    Crypto::KeyImage keyImage;

    Crypto::crypto_funcs::generate_key_image(publicEphemeral, privateEphemeral, keyImage);

    return makeJNI32ByteKey(env, keyImage);
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_hugin_TurtleCoinModule_deriveSecretKeyJNI(
    JNIEnv *env,
    jobject instance,
    jstring jDerivation,
    jlong outputIndex,
    jstring jPrivateSpendKey)
{
    const auto derivation = makeNative32ByteKey<Crypto::KeyDerivation>(env, jDerivation);
    const auto privateSpendKey = makeNative32ByteKey<Crypto::SecretKey>(env, jPrivateSpendKey);

    Crypto::SecretKey derivedKey;

    Crypto::crypto_funcs::derive_secret_key(derivation, outputIndex, privateSpendKey, derivedKey);

    return makeJNI32ByteKey(env, derivedKey);
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_hugin_TurtleCoinModule_derivePublicKeyJNI(
    JNIEnv *env,
    jobject instance,
    jstring jDerivation,
    jlong outputIndex,
    jstring jPublicSpendKey)
{
    const auto derivation = makeNative32ByteKey<Crypto::KeyDerivation>(env, jDerivation);
    const auto publicSpendKey = makeNative32ByteKey<Crypto::PublicKey>(env, jPublicSpendKey);

    Crypto::PublicKey derivedKey;

    Crypto::crypto_funcs::derive_public_key(derivation, outputIndex, publicSpendKey, derivedKey);

    return makeJNI32ByteKey(env, derivedKey);
}

std::vector<Crypto::PublicKey> makeNativePublicKeys(JNIEnv *env, jobjectArray jPublicKeys)
{
    std::vector<Crypto::PublicKey> publicKeys;

    int len = env->GetArrayLength(jPublicKeys);

    for (int i = 0; i < len; i++)
    {
        jstring jPublicKey = (jstring)env->GetObjectArrayElement(jPublicKeys, i);
        publicKeys.push_back(makeNative32ByteKey<Crypto::PublicKey>(env, jPublicKey));
        env->DeleteLocalRef(jPublicKey);
    }

    return publicKeys;
}

std::vector<Crypto::Signature> makeNativeSignatures(JNIEnv *env, jobjectArray jSignatures)
{
    std::vector<Crypto::Signature> signatures;

    int len = env->GetArrayLength(jSignatures);

    for (int i = 0; i < len; i++)
    {
        jstring jSignature = (jstring)env->GetObjectArrayElement(jSignatures, i);
        signatures.push_back(makeNative64ByteKey<Crypto::Signature>(env, jSignature));
        env->DeleteLocalRef(jSignature);
    }

    return signatures;
}

WalletBlockInfo makeNativeWalletBlockInfo(JNIEnv *env, jobject jWalletBlockInfo)
{
    WalletBlockInfo result;

    jobject tx = env->GetObjectField(jWalletBlockInfo, WALLET_BLOCK_INFO_COINBASE_TRANSACTION);

    if (tx != nullptr)
    {
        result.coinbaseTransaction = makeNativeRawTransaction(env, tx);
        env->DeleteLocalRef(tx);
    }

    jobjectArray transactions = (jobjectArray)env->GetObjectField(jWalletBlockInfo, WALLET_BLOCK_INFO_TRANSACTIONS);
    result.transactions = makeNativeTransactionVector(env, transactions);
    env->DeleteLocalRef(transactions);

    return result;
}

std::string makeNativeString(JNIEnv *env, jstring jStr)
{
    const char *nativeString = env->GetStringUTFChars(jStr, nullptr);
    std::string str(nativeString);
    env->ReleaseStringUTFChars(jStr, nativeString);
    return str;
}

std::vector<RawTransaction> makeNativeTransactionVector(JNIEnv *env, jobjectArray jTransactions)
{
    std::vector<RawTransaction> transactions;

    int len = env->GetArrayLength(jTransactions);

    for (int i = 0; i < len; i++)
    {
        jobject tx = env->GetObjectArrayElement(jTransactions, i);
        transactions.push_back(makeNativeRawTransaction(env, tx));
        env->DeleteLocalRef(tx);
    }

    return transactions;
}

RawTransaction makeNativeRawTransaction(JNIEnv *env, jobject jRawTransaction)
{
    RawTransaction transaction;

    jobjectArray keyOutputs = (jobjectArray)env->GetObjectField(jRawTransaction, RAW_TRANSACTION_KEY_OUTPUTS);
    transaction.keyOutputs = makeNativeKeyOutputVector(env, keyOutputs);
    env->DeleteLocalRef(keyOutputs);

    jstring hash = (jstring)env->GetObjectField(jRawTransaction, RAW_TRANSACTION_HASH);
    transaction.hash = makeNativeString(env, hash);
    env->DeleteLocalRef(hash);

    jstring key = (jstring)env->GetObjectField(jRawTransaction, RAW_TRANSACTION_TRANSACTION_PUBLIC_KEY);
    transaction.transactionPublicKey = makeNative32ByteKey<Crypto::PublicKey>(env, key);
    env->DeleteLocalRef(key);

    return transaction;
}

std::vector<KeyOutput> makeNativeKeyOutputVector(JNIEnv *env, jobjectArray jKeyOutputs)
{
    std::vector<KeyOutput> keyOutputs;

    int len = env->GetArrayLength(jKeyOutputs);

    for (int i = 0; i < len; i++)
    {
        jobject keyOutput = env->GetObjectArrayElement(jKeyOutputs, i);
        keyOutputs.push_back(makeNativeKeyOutput(env, keyOutput));
        env->DeleteLocalRef(keyOutput);
    }

    return keyOutputs;
}

uint64_t makeNativeUint(JNIEnv *env, jlong javaLong)
{
    if (javaLong < 0)
    {
        throw std::invalid_argument("Negative value cannot be converted to uint64_t");
    }

    // Return the value as uint64_t
    return static_cast<uint64_t>(javaLong);
}

KeyOutput makeNativeKeyOutput(JNIEnv *env, jobject jKeyOutput)
{
    KeyOutput output;

    jstring key = (jstring)env->GetObjectField(jKeyOutput, KEY_OUTPUT_KEY);

    output.key = makeNative32ByteKey<Crypto::PublicKey>(env, key);

    env->DeleteLocalRef(key);

    output.amount = env->GetLongField(jKeyOutput, KEY_OUTPUT_AMOUNT);

    output.globalIndex = env->GetLongField(jKeyOutput, KEY_OUTPUT_GLOBAL_INDEX);

    return output;
}

std::unordered_map<Crypto::PublicKey, Crypto::SecretKey> makeNativeSpendKeys(JNIEnv *env, jobjectArray jSpendKeys)
{
    std::unordered_map<Crypto::PublicKey, Crypto::SecretKey> spendKeys;

    int len = env->GetArrayLength(jSpendKeys);

    for (int i = 0; i < len; i++)
    {
        jobject jSpendKey = env->GetObjectArrayElement(jSpendKeys, i);

        jstring pubKey = (jstring)env->GetObjectField(jSpendKey, SPEND_KEY_PUBLIC_KEY);
        jstring privKey = (jstring)env->GetObjectField(jSpendKey, SPEND_KEY_PRIVATE_KEY);

        Crypto::PublicKey publicKey = makeNative32ByteKey<Crypto::PublicKey>(env, pubKey);
        Crypto::SecretKey privateKey = makeNative32ByteKey<Crypto::SecretKey>(env, privKey);

        env->DeleteLocalRef(jSpendKey);
        env->DeleteLocalRef(pubKey);
        env->DeleteLocalRef(privKey);

        spendKeys[publicKey] = privateKey;
    }

    return spendKeys;
}

jobjectArray makeJNISignatures(JNIEnv *env, const std::vector<Crypto::Signature> &signatures)
{
    jobjectArray jniSignatures = env->NewObjectArray(
        signatures.size(), JAVA_STRING, nullptr);

    int i = 0;

    for (const auto &signature : signatures)
    {
        env->SetObjectArrayElement(jniSignatures, i, makeJNI64ByteKey(env, signature));
        i++;
    }

    return jniSignatures;
}

jobjectArray makeJNIInputs(JNIEnv *env, const std::vector<std::tuple<Crypto::PublicKey, TransactionInput>> &inputs)
{
    jobjectArray jniInputs = env->NewObjectArray(
        inputs.size(), INPUT_MAP, nullptr);

    int i = 0;

    for (const auto &[publicKey, input] : inputs)
    {
        env->SetObjectArrayElement(jniInputs, i, env->NewObject(INPUT_MAP, INPUT_MAP_CONST, makeJNI32ByteKey(env, publicKey), makeJNIInput(env, input)));

        i++;
    }

    return jniInputs;
}

jobject makeJNIInput(JNIEnv *env, const TransactionInput &input)
{
    return env->NewObject(
        TRANSACTION_INPUT, TRANSACTION_INPUT_CONST, makeJNI32ByteKey(env, input.keyImage),
        input.amount, input.transactionIndex, input.globalOutputIndex,
        makeJNI32ByteKey(env, input.key),
        env->NewStringUTF(input.parentTransactionHash.c_str()));
}

/* input should be size of input len. output should be double that. */
void byteArrayToHexString(const uint8_t *input, char *output, size_t inputLen)
{
    char hexval[16] = {
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        'a', 'b', 'c', 'd', 'e', 'f'};

    for (int i = 0; i < inputLen; i++)
    {
        output[i * 2] = hexval[((input[i] >> 4) & 0xF)];
        output[(i * 2) + 1] = hexval[(input[i]) & 0x0F];
    }
}

int char2int(char input)
{
    if (input >= '0' && input <= '9')
    {
        return input - '0';
    }

    if (input >= 'A' && input <= 'F')
    {
        return input - 'A' + 10;
    }

    if (input >= 'a' && input <= 'f')
    {
        return input - 'a' + 10;
    }

    return -1;
}

/* input should be double size of output len. */
void hexStringToByteArray(const char *input, uint8_t *output, size_t outputLen)
{
    for (int i = 0; i < outputLen; i++)
    {
        output[i] = char2int(input[i * 2]) * 16 +
                    char2int(input[(i * 2) + 1]);
    }
}

std::vector<std::tuple<Crypto::PublicKey, TransactionInput>> processBlockOutputs(
    const WalletBlockInfo &block,
    const Crypto::SecretKey &privateViewKey,
    const std::unordered_map<Crypto::PublicKey, Crypto::SecretKey> &spendKeys,
    const bool isViewWallet,
    const bool processCoinbaseTransactions)
{

    std::vector<std::tuple<Crypto::PublicKey, TransactionInput>> inputs;

    /* Process the coinbase tx if we're not skipping them for speed */
    if (processCoinbaseTransactions && block.coinbaseTransaction)
    {
        processTransactionOutputs(
            *block.coinbaseTransaction, privateViewKey, spendKeys, isViewWallet, inputs);
    }

    /* Process the normal txs */
    for (const auto &tx : block.transactions)
    {
        processTransactionOutputs(
            tx, privateViewKey, spendKeys, isViewWallet, inputs);
    }

    return inputs;
}

void processTransactionOutputs(
    const RawTransaction &tx,
    const Crypto::SecretKey &privateViewKey,
    const std::unordered_map<Crypto::PublicKey, Crypto::SecretKey> &spendKeys,
    const bool isViewWallet,
    std::vector<std::tuple<Crypto::PublicKey, TransactionInput>> &inputs)
{
    Crypto::KeyDerivation derivation;

    /* Generate the key derivation from the random tx public key, and our private
       view key */
    Crypto::crypto_funcs::generate_key_derivation(
        tx.transactionPublicKey, privateViewKey, derivation);

    uint32_t outputIndex = 0;

    for (const auto &output : tx.keyOutputs)
    {
        Crypto::PublicKey derivedSpendKey;

        /* Derive the public spend key from the transaction, using the previous
           derivation */
        Crypto::crypto_funcs::underive_public_key(
            derivation, outputIndex, output.key, derivedSpendKey);

        /* See if the derived spend key matches any of our spend keys */
        const auto ourPrivateSpendKey = spendKeys.find(derivedSpendKey);

        /* If it does, the transaction belongs to us */
        if (ourPrivateSpendKey != spendKeys.end())
        {
            TransactionInput input;

            input.amount = output.amount;
            input.transactionIndex = outputIndex;
            input.globalOutputIndex = output.globalIndex;
            input.key = output.key;
            input.parentTransactionHash = tx.hash;

            if (!isViewWallet)
            {
                /* Make a temporary key pair */
                Crypto::PublicKey tmpPublicKey;
                Crypto::SecretKey tmpSecretKey;

                /* Get the tmp public key from the derivation, the index,
                   and our public spend key */
                Crypto::crypto_funcs::derive_public_key(
                    derivation, outputIndex, derivedSpendKey, tmpPublicKey);

                /* Get the tmp private key from the derivation, the index,
                   and our private spend key */
                Crypto::crypto_funcs::derive_secret_key(
                    derivation, outputIndex, ourPrivateSpendKey->second, tmpSecretKey);

                /* Get the key image from the tmp public and private key */
                Crypto::crypto_funcs::generate_key_image(
                    tmpPublicKey, tmpSecretKey, input.keyImage);
            }

            inputs.emplace_back(derivedSpendKey, input);
        }

        outputIndex++;
    }
}
