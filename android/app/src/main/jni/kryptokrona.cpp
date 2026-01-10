// Copyright (c) 2018-2020, The TurtleCoin Developers
// Copyright (c) 2019-2024, kryptokrona Developers
//
// Please see the included LICENSE file for more information.

#include "StringTools.h"
#include <string.h>
#include "kryptokrona.h"
#include "multisig.h"

namespace Core
{
    template <typename T>
    void toTypedVector(const std::vector<std::string> &stringVector, std::vector<T> &result)
    {
        result.clear();

        for (const auto & element : stringVector)
        {
            T value = T();

            Common::podFromHex(element, value);

            result.push_back(value);
        }
    }

    template <typename T>
    void toStringVector(const std::vector<T> &typedVector, std::vector<std::string> &result)
    {
        result.clear();

        for (const auto & element : typedVector)
        {
            if (sizeof(element) == sizeof(Crypto::Signature))
            {
                result.push_back(Common::toHex(&element, sizeof(element)));
            }
            else
            {
                result.push_back(Common::podToHex(element));
            }
        }
    }

    inline Crypto::BinaryArray toBinaryArray(const std::string input)
    {
        return Common::fromHex(input);
    }

    /* Hashing Methods */
    std::string Cryptography::cn_fast_hash(const std::string input)
    {
        Crypto::Hash hash = Crypto::Hash();

        Crypto::BinaryArray data = toBinaryArray(input);

        Crypto::cn_fast_hash(data.data(), data.size(), hash);

        return Common::podToHex(hash);
    }

    /* Crypto Methods */
    bool Cryptography::generateRingSignatures(
        const std::string prefixHash,
        const std::string keyImage,
        const std::vector<std::string> publicKeys,
        const std::string transactionSecretKey,
        const uint64_t realOutput,
        std::vector<std::string> &signatures)
    {
        Crypto::Hash l_prefixHash = Crypto::Hash();

        Common::podFromHex(prefixHash, l_prefixHash);

        Crypto::KeyImage l_keyImage = Crypto::KeyImage();

        Common::podFromHex(keyImage, l_keyImage);

        std::vector<Crypto::PublicKey> l_publicKeys;

        toTypedVector(publicKeys, l_publicKeys);

        Crypto::SecretKey l_transactionSecretKey;

        Common::podFromHex(transactionSecretKey, l_transactionSecretKey);

        std::vector<Crypto::Signature> l_signatures;

        bool success = Crypto::crypto_funcs::generateRingSignatures(
            l_prefixHash, l_keyImage, l_publicKeys, l_transactionSecretKey, realOutput, l_signatures);

        if (success)
        {
            toStringVector(l_signatures, signatures);
        }

        return success;
    }

    bool Cryptography::checkRingSignature(
        const std::string prefixHash,
        const std::string keyImage,
        const std::vector<std::string> publicKeys,
        const std::vector<std::string> signatures)
    {
        Crypto::Hash l_prefixHash = Crypto::Hash();

        Common::podFromHex(prefixHash, l_prefixHash);

        Crypto::KeyImage l_keyImage = Crypto::KeyImage();

        Common::podFromHex(keyImage, l_keyImage);

        std::vector<Crypto::PublicKey> l_publicKeys;

        toTypedVector(publicKeys, l_publicKeys);

        std::vector<Crypto::Signature> l_signatures;

        toTypedVector(signatures, l_signatures);

        return Crypto::crypto_funcs::checkRingSignature(l_prefixHash, l_keyImage, l_publicKeys, l_signatures);
    }

    std::string Cryptography::generatePrivateViewKeyFromPrivateSpendKey(const std::string privateSpendKey)
    {
        Crypto::SecretKey l_privateSpendKey = Crypto::SecretKey();

        Common::podFromHex(privateSpendKey, l_privateSpendKey);

        Crypto::SecretKey privateViewKey = Crypto::SecretKey();

        Crypto::crypto_funcs::generateViewFromSpend(l_privateSpendKey, privateViewKey);

        return Common::podToHex(privateViewKey);
    }

    void Cryptography::generateViewKeysFromPrivateSpendKey(
        const std::string privateSpendKey,
        std::string &privateViewKey,
        std::string &publicViewKey)
    {
        Crypto::SecretKey l_privateSpendKey = Crypto::SecretKey();

        Common::podFromHex(privateSpendKey, l_privateSpendKey);

        Crypto::SecretKey l_privateViewKey = Crypto::SecretKey();

        Crypto::PublicKey l_publicViewKey = Crypto::PublicKey();

        Crypto::crypto_funcs::generateViewFromSpend(l_privateSpendKey, l_privateViewKey, l_publicViewKey);

        privateViewKey = Common::podToHex(l_privateViewKey);

        publicViewKey = Common::podToHex(l_publicViewKey);
    }

    void Cryptography::generateKeys(std::string &privateKey, std::string &publicKey)
    {
        Crypto::SecretKey l_privateKey = Crypto::SecretKey();

        Crypto::PublicKey l_publicKey = Crypto::PublicKey();

        Crypto::generate_keys(l_publicKey, l_privateKey);

        privateKey = Common::podToHex(l_privateKey);

        publicKey = Common::podToHex(l_publicKey);
    }

    bool Cryptography::checkKey(const std::string publicKey)
    {
        Crypto::PublicKey l_publicKey = Crypto::PublicKey();

        Common::podFromHex(publicKey, l_publicKey);

        return Crypto::check_key(l_publicKey);
    }

    bool Cryptography::secretKeyToPublicKey(const std::string privateKey, std::string &publicKey)
    {
        Crypto::SecretKey l_privateKey = Crypto::SecretKey();

        Common::podFromHex(privateKey, l_privateKey);

        Crypto::PublicKey l_publicKey = Crypto::PublicKey();

        bool success = Crypto::secret_key_to_public_key(l_privateKey, l_publicKey);

        if (success)
        {
            publicKey = Common::podToHex(l_publicKey);
        }

        return success;
    }

    bool Cryptography::generateKeyDerivation(
        const std::string publicKey,
        const std::string privateKey,
        std::string &derivation)
    {
        Crypto::PublicKey l_publicKey = Crypto::PublicKey();

        Common::podFromHex(publicKey, l_publicKey);

        Crypto::SecretKey l_privateKey = Crypto::SecretKey();

        Common::podFromHex(privateKey, l_privateKey);

        Crypto::KeyDerivation l_derivation = Crypto::KeyDerivation();

        bool success = Crypto::generate_key_derivation(l_publicKey, l_privateKey, l_derivation);

        if (success)
        {
            derivation = Common::podToHex(l_derivation);
        }

        return success;
    }

    std::string Cryptography::generateKeyDerivationScalar(
        const std::string publicKey,
        const std::string secretKey,
        const uint64_t outputIndex)
    {
        std::string scalar = std::string();

        if (generateKeyDerivation(publicKey, secretKey, scalar))
        {
            scalar = derivationToScalar(scalar, outputIndex);
        }

        return scalar;
    }

    std::string Cryptography::derivationToScalar(const std::string derivation, const uint64_t outputIndex)
    {
        Crypto::KeyDerivation l_derivation = Crypto::KeyDerivation();

        Common::podFromHex(derivation, l_derivation);

        Crypto::EllipticCurveScalar derivationScalar;

        Crypto::derivation_to_scalar(l_derivation, outputIndex, derivationScalar);

        return Common::podToHex(derivationScalar);
    }

    bool Cryptography::derivePublicKey(
        const std::string &derivation,
        const uint64_t outputIndex,
        const std::string &publicKey,
        std::string &derivedKey)
    {
        Crypto::KeyDerivation l_derivation = Crypto::KeyDerivation();

        Common::podFromHex(derivation, l_derivation);

        Crypto::PublicKey l_publicKey = Crypto::PublicKey();

        Common::podFromHex(publicKey, l_publicKey);

        Crypto::PublicKey l_derivedKey = Crypto::PublicKey();

        bool success = Crypto::derive_public_key(l_derivation, outputIndex, l_publicKey, l_derivedKey);

        if (success)
        {
            derivedKey = Common::podToHex(l_derivedKey);
        }

        return success;
    }

    bool Cryptography::derivePublicKey(
        const std::string &derivationScalar,
        const std::string &publicKey,
        std::string &derivedKey)
    {
        Crypto::EllipticCurveScalar l_derivationScalar = Crypto::EllipticCurveScalar();

        Common::podFromHex(derivationScalar, l_derivationScalar);

        Crypto::PublicKey l_publicKey = Crypto::PublicKey();

        Common::podFromHex(publicKey, l_publicKey);

        Crypto::PublicKey l_derivedKey = Crypto::PublicKey();

        bool success = Crypto::derive_public_key(l_derivationScalar, l_publicKey, l_derivedKey);

        if (success)
        {
            derivedKey = Common::podToHex(l_derivedKey);
        }

        return success;
    }

    std::string Cryptography::deriveSecretKey(
        const std::string &derivation,
        const uint64_t outputIndex,
        const std::string &privateKey)
    {
        Crypto::KeyDerivation l_derivation = Crypto::KeyDerivation();

        Common::podFromHex(derivation, l_derivation);

        Crypto::SecretKey l_privateKey = Crypto::SecretKey();

        Common::podFromHex(privateKey, l_privateKey);

        Crypto::SecretKey l_derivedKey = Crypto::SecretKey();

        Crypto::derive_secret_key(l_derivation, outputIndex, l_privateKey, l_derivedKey);

        return Common::podToHex(l_derivedKey);
    }

    std::string Cryptography::deriveSecretKey(const std::string &derivationScalar, const std::string &privateKey)
    {
        Crypto::EllipticCurveScalar l_derivationScalar = Crypto::EllipticCurveScalar();

        Common::podFromHex(derivationScalar, l_derivationScalar);

        Crypto::SecretKey l_privateKey = Crypto::SecretKey();

        Common::podFromHex(privateKey, l_privateKey);

        Crypto::SecretKey l_derivedKey = Crypto::SecretKey();

        Crypto::derive_secret_key(l_derivationScalar, l_privateKey, l_derivedKey);

        return Common::podToHex(l_derivedKey);
    }

    bool Cryptography::underivePublicKey(
        const std::string derivation,
        const uint64_t outputIndex,
        const std::string derivedKey,
        std::string &publicKey)
    {
        Crypto::KeyDerivation l_derivation = Crypto::KeyDerivation();

        Common::podFromHex(derivation, l_derivation);

        Crypto::PublicKey l_derivedKey = Crypto::PublicKey();

        Common::podFromHex(derivedKey, l_derivedKey);

        Crypto::PublicKey l_publicKey = Crypto::PublicKey();

        bool success = Crypto::underive_public_key(l_derivation, outputIndex, l_derivedKey, l_publicKey);

        if (success)
        {
            publicKey = Common::podToHex(l_publicKey);
        }

        return success;
    }

    std::string Cryptography::generateSignature(
        const std::string prefixHash,
        const std::string publicKey,
        const std::string privateKey)
    {
        Crypto::Hash l_prefixHash = Crypto::Hash();

        Common::podFromHex(prefixHash, l_prefixHash);

        Crypto::PublicKey l_publicKey = Crypto::PublicKey();

        Common::podFromHex(publicKey, l_publicKey);

        Crypto::SecretKey l_privateKey = Crypto::SecretKey();

        Common::podFromHex(privateKey, l_privateKey);

        Crypto::Signature l_signature = Crypto::Signature();

        Crypto::generate_signature(l_prefixHash, l_publicKey, l_privateKey, l_signature);

        return Common::podToHex(l_signature);
    }

    bool Cryptography::checkSignature(
        const std::string prefixHash,
        const std::string publicKey,
        const std::string signature)
    {
        Crypto::Hash l_prefixHash = Crypto::Hash();

        Common::podFromHex(prefixHash, l_prefixHash);

        Crypto::PublicKey l_publicKey = Crypto::PublicKey();

        Common::podFromHex(publicKey, l_publicKey);

        Crypto::Signature l_signature = Crypto::Signature();

        Common::podFromHex(signature, l_signature);

        return Crypto::check_signature(l_prefixHash, l_publicKey, l_signature);
    }

    std::string Cryptography::generateKeyImage(const std::string publicKey, const std::string privateKey)
    {
        Crypto::PublicKey l_publicKey = Crypto::PublicKey();

        Common::podFromHex(publicKey, l_publicKey);

        Crypto::SecretKey l_privateKey = Crypto::SecretKey();

        Common::podFromHex(privateKey, l_privateKey);

        Crypto::KeyImage l_keyImage = Crypto::KeyImage();

        Crypto::generate_key_image(l_publicKey, l_privateKey, l_keyImage);

        return Common::podToHex(l_keyImage);
    }

    std::string Cryptography::scalarmultKey(const std::string keyImageA, const std::string keyImageB)
    {
        Crypto::KeyImage l_keyImageA = Crypto::KeyImage();

        Common::podFromHex(keyImageA, l_keyImageA);

        Crypto::KeyImage l_keyImageB = Crypto::KeyImage();

        Common::podFromHex(keyImageB, l_keyImageB);

        Crypto::KeyImage l_keyImage = Crypto::scalarmultKey(l_keyImageA, l_keyImageB);

        return Common::podToHex(l_keyImage);
    }

    std::string Cryptography::hashToEllipticCurve(const std::string hash)
    {
        Crypto::Hash l_hash = Crypto::Hash();

        Common::podFromHex(hash, l_hash);

        Crypto::PublicKey l_ellipticCurve = Crypto::PublicKey();

        Crypto::hash_data_to_ec(l_hash.data, sizeof(l_hash.data), l_ellipticCurve);

        return Common::podToHex(l_ellipticCurve);
    }

    std::string Cryptography::scReduce32(const std::string data)
    {
        Crypto::EllipticCurveScalar l_scalar;

        Common::podFromHex(data, l_scalar);

        Crypto::scReduce32(l_scalar);

        return Common::podToHex(l_scalar);
    }

    std::string Cryptography::hashToScalar(const std::string hash)
    {
        Crypto::BinaryArray l_hash = toBinaryArray(hash);

        Crypto::EllipticCurveScalar l_scalar;

        Crypto::hashToScalar(l_hash.data(), l_hash.size(), l_scalar);

        return Common::podToHex(l_scalar);
    }

    bool Cryptography::generateDeterministicSubwalletKeys(
        const std::string basePrivateKey,
        const uint64_t walletIndex,
        std::string &privateKey,
        std::string &publicKey)
    {
        Crypto::SecretKey l_basePrivateKey;

        Common::podFromHex(basePrivateKey, l_basePrivateKey);

        Crypto::SecretKey l_privateKey;

        Crypto::PublicKey l_publicKey;

        if (Crypto::generate_deterministic_subwallet_keys(l_basePrivateKey, walletIndex, l_privateKey, l_publicKey))
        {
            privateKey = Common::podToHex(l_privateKey);

            publicKey = Common::podToHex(l_publicKey);

            return true;
        }

        return false;
    }

    std::string Cryptography::restoreKeyImage(
        const std::string &publicEphemeral,
        const std::string &derivation,
        const size_t output_index,
        const std::vector<std::string> &partialKeyImages)
    {
        Crypto::PublicKey l_publicEphemeral;

        Common::podFromHex(publicEphemeral, l_publicEphemeral);

        Crypto::KeyDerivation l_derivation;

        Common::podFromHex(derivation, l_derivation);

        std::vector<Crypto::KeyImage> l_partialKeyImages;

        toTypedVector(partialKeyImages, l_partialKeyImages);

        Crypto::KeyImage l_keyImage =
            Crypto::Multisig::restore_key_image(l_publicEphemeral, l_derivation, output_index, l_partialKeyImages);

        return Common::podToHex(l_keyImage);
    }

    bool Cryptography::restoreRingSignatures(
        const std::string &derivation,
        const size_t output_index,
        const std::vector<std::string> &partialSigningKeys,
        const uint64_t realOutput,
        const std::string &k,
        std::vector<std::string> &signatures)
    {
        Crypto::KeyDerivation l_derivation;

        Common::podFromHex(derivation, l_derivation);

        std::vector<Crypto::SecretKey> l_partialSigningKeys;

        toTypedVector(partialSigningKeys, l_partialSigningKeys);

        Crypto::EllipticCurveScalar l_k;

        Common::podFromHex(k, l_k);

        std::vector<Crypto::Signature> l_signatures;

        toTypedVector(signatures, l_signatures);

        const auto success = Crypto::Multisig::restore_ring_signatures(
            l_derivation, output_index, l_partialSigningKeys, realOutput, l_k, l_signatures);

        if (success)
        {
            toStringVector(l_signatures, signatures);
        }

        return success;
    }

    std::string
    Cryptography::generatePartialSigningKey(const std::string &signature, const std::string &privateSpendKey)
    {
        Crypto::Signature l_signature;

        Common::podFromHex(signature, l_signature);

        Crypto::SecretKey l_privateSpendKey;

        Common::podFromHex(privateSpendKey, l_privateSpendKey);

        Crypto::SecretKey l_key = Crypto::Multisig::generate_partial_signing_key(l_signature, l_privateSpendKey);

        return Common::podToHex(l_key);
    }

    bool Cryptography::prepareRingSignatures(
        const std::string prefixHash,
        const std::string keyImage,
        const std::vector<std::string> publicKeys,
        const uint64_t realOutput,
        std::vector<std::string> &signatures,
        std::string &k)
    {
        Crypto::Hash l_prefixHash;

        Common::podFromHex(prefixHash, l_prefixHash);

        Crypto::KeyImage l_keyImage;

        Common::podFromHex(keyImage, l_keyImage);

        std::vector<Crypto::PublicKey> l_publicKeys;

        toTypedVector(publicKeys, l_publicKeys);

        std::vector<Crypto::Signature> l_signatures;

        Crypto::EllipticCurveScalar l_k;

        const auto success = Crypto::crypto_funcs::prepareRingSignatures(
            l_prefixHash, l_keyImage, l_publicKeys, realOutput, l_signatures, l_k);

        if (success)
        {
            toStringVector(l_signatures, signatures);

            k = Common::podToHex(l_k);
        }

        return success;
    }

    bool Cryptography::prepareRingSignatures(
        const std::string prefixHash,
        const std::string keyImage,
        const std::vector<std::string> publicKeys,
        const uint64_t realOutput,
        const std::string k,
        std::vector<std::string> &signatures)
    {
        Crypto::Hash l_prefixHash;

        Common::podFromHex(prefixHash, l_prefixHash);

        Crypto::KeyImage l_keyImage;

        Common::podFromHex(keyImage, l_keyImage);

        std::vector<Crypto::PublicKey> l_publicKeys;

        toTypedVector(publicKeys, l_publicKeys);

        std::vector<Crypto::Signature> l_signatures;

        Crypto::EllipticCurveScalar l_k;

        Common::podFromHex(k, l_k);

        const auto success = Crypto::crypto_funcs::prepareRingSignatures(
            l_prefixHash, l_keyImage, l_publicKeys, realOutput, l_k, l_signatures);

        if (success)
        {
            toStringVector(l_signatures, signatures);
        }

        return success;
    }

    bool Cryptography::completeRingSignatures(
        const std::string transactionSecretKey,
        const uint64_t realOutput,
        const std::string &k,
        std::vector<std::string> &signatures)
    {
        Crypto::SecretKey l_transactionSecretKey;

        Common::podFromHex(transactionSecretKey, l_transactionSecretKey);

        Crypto::EllipticCurveScalar l_k;

        Common::podFromHex(k, l_k);

        std::vector<Crypto::Signature> l_signatures;

        toTypedVector(signatures, l_signatures);

        const auto success =
            Crypto::crypto_funcs::completeRingSignatures(l_transactionSecretKey, realOutput, l_k, l_signatures);

        if (success)
        {
            toStringVector(l_signatures, signatures);
        }

        return success;
    }

    std::vector<std::string> Cryptography::calculateMultisigPrivateKeys(
        const std::string &ourPrivateSpendKey,
        const std::vector<std::string> &publicKeys)
    {
        Crypto::SecretKey l_ourPrivateSpendKey;

        Common::podFromHex(ourPrivateSpendKey, l_ourPrivateSpendKey);

        std::vector<Crypto::PublicKey> l_publicKeys;

        toTypedVector(publicKeys, l_publicKeys);

        std::vector<Crypto::SecretKey> l_multisigKeys =
            Crypto::Multisig::calculate_multisig_private_keys(l_ourPrivateSpendKey, l_publicKeys);

        std::vector<std::string> multisigKeys;

        toStringVector(l_multisigKeys, multisigKeys);

        return multisigKeys;
    }

    std::string Cryptography::calculateSharedPrivateKey(const std::vector<std::string> &secretKeys)
    {
        std::vector<Crypto::SecretKey> l_secretKeys;

        toTypedVector(secretKeys, l_secretKeys);

        Crypto::SecretKey sharedPrivateKey = Crypto::Multisig::calculate_shared_private_key(l_secretKeys);

        return Common::podToHex(sharedPrivateKey);
    }

    std::string Cryptography::calculateSharedPublicKey(const std::vector<std::string> &publicKeys)
    {
        std::vector<Crypto::PublicKey> l_publicKeys;

        toTypedVector(publicKeys, l_publicKeys);

        Crypto::PublicKey sharedPublicKey = Crypto::Multisig::calculate_shared_public_key(l_publicKeys);

        return Common::podToHex(sharedPublicKey);
    }
} // namespace Core

inline void tree_hash(const char *hashes, const uint64_t hashesLength, char *&hash)
{
    const std::string *hashesBuffer = reinterpret_cast<const std::string *>(hashes);

    std::vector<std::string> l_hashes(hashesBuffer, hashesBuffer + hashesLength);

    std::string result = Core::Cryptography::tree_hash(l_hashes);

    hash = strdup(result.c_str());
}

inline void tree_branch(const char *hashes, const uint64_t hashesLength, char *&branch)
{
    const std::string *hashesBuffer = reinterpret_cast<const std::string *>(hashes);

    std::vector<std::string> l_hashes(hashesBuffer, hashesBuffer + hashesLength);

    std::vector<std::string> l_branch = Core::Cryptography::tree_branch(l_hashes);

    branch = reinterpret_cast<char *>(l_branch.data());
}

inline void tree_hash_from_branch(
    const char *branches,
    const uint64_t branchesLength,
    const char *leaf,
    const char *path,
    char *&hash)
{
    const std::string *branchesBuffer = reinterpret_cast<const std::string *>(branches);

    std::vector<std::string> l_branches(branchesBuffer, branchesBuffer + branchesLength);

    std::string l_hash = Core::Cryptography::tree_hash_from_branch(l_branches, leaf, path);

    hash = strdup(l_hash.c_str());
}

inline int generateRingSignatures(
    const char *prefixHash,
    const char *keyImage,
    const char *publicKeys,
    uint64_t publicKeysLength,
    const char *transactionSecretKey,
    const uint64_t realOutput,
    char *&signatures)
{
    const std::string *publicKeysBuffer = reinterpret_cast<const std::string *>(publicKeys);

    std::vector<std::string> l_publicKeys(publicKeysBuffer, publicKeysBuffer + publicKeysLength);

    std::vector<std::string> l_signatures;

    bool success = Core::Cryptography::generateRingSignatures(
        prefixHash, keyImage, l_publicKeys, transactionSecretKey, realOutput, l_signatures);

    if (success)
    {
        signatures = reinterpret_cast<char *>(l_signatures.data());
    }

    return success;
}

inline bool checkRingSignature(
    const char *prefixHash,
    const char *keyImage,
    const char *publicKeys,
    const uint64_t publicKeysLength,
    const char *signatures,
    const uint64_t signaturesLength)
{
    const std::string *publicKeysBuffer = reinterpret_cast<const std::string *>(publicKeys);

    std::vector<std::string> l_publicKeys(publicKeysBuffer, publicKeysBuffer + publicKeysLength);

    const std::string *signaturesBuffer = reinterpret_cast<const std::string *>(signatures);

    std::vector<std::string> l_signatures(signaturesBuffer, signaturesBuffer + signaturesLength);

    return Core::Cryptography::checkRingSignature(prefixHash, keyImage, l_publicKeys, l_signatures);
}

inline void generateViewKeysFromPrivateSpendKey(const char *privateSpendKey, char *&privateKey, char *&publicKey)
{
    std::string l_privateKey;

    std::string l_publicKey;

    Core::Cryptography::generateViewKeysFromPrivateSpendKey(privateSpendKey, l_privateKey, l_publicKey);

    privateKey = strdup(l_privateKey.c_str());

    publicKey = strdup(l_publicKey.c_str());
}

inline void generateKeys(char *&privateKey, char *&publicKey)
{
    std::string l_privateKey;

    std::string l_publicKey;

    Core::Cryptography::generateKeys(l_privateKey, l_publicKey);

    privateKey = strdup(l_privateKey.c_str());

    publicKey = strdup(l_publicKey.c_str());
}

inline int secretKeyToPublicKey(const char *privateKey, char *&publicKey)
{
    std::string l_publicKey;

    bool success = Core::Cryptography::secretKeyToPublicKey(privateKey, l_publicKey);

    publicKey = strdup(l_publicKey.c_str());

    return success;
}

inline int generateKeyDerivation(const char *publicKey, const char *privateKey, char *&derivation)
{
    std::string l_derivation;

    bool success = Core::Cryptography::generateKeyDerivation(publicKey, privateKey, l_derivation);

    derivation = strdup(l_derivation.c_str());

    return success;
}

inline int
derivePublicKey(const char *derivation, const uint64_t outputIndex, const char *publicKey, char *&outPublicKey)
{
    std::string l_outPublicKey;

    bool success = Core::Cryptography::derivePublicKey(derivation, outputIndex, publicKey, l_outPublicKey);

    outPublicKey = strdup(l_outPublicKey.c_str());

    return success;
}

inline int
underivePublicKey(const char *derivation, const uint64_t outputIndex, const char *derivedKey, char *&publicKey)
{
    std::string l_publicKey;

    bool success = Core::Cryptography::underivePublicKey(derivation, outputIndex, derivedKey, l_publicKey);

    publicKey = strdup(l_publicKey.c_str());

    return success;
}

inline bool generateDeterministicSubwalletKeys(
    const char *basePrivateKey,
    const uint64_t walletIndex,
    char *&privateKey,
    char *&publicKey)
{
    std::string l_privateKey;

    std::string l_publicKey;

    if (Core::Cryptography::generateDeterministicSubwalletKeys(basePrivateKey, walletIndex, l_privateKey, l_publicKey))
    {
        privateKey = strdup(l_privateKey.c_str());

        publicKey = strdup(l_publicKey.c_str());

        return true;
    }

    return false;
}

inline int completeRingSignatures(
    const char *transactionSecretKey,
    const uint64_t realOutput,
    const char *k,
    char *&signatures,
    const uint64_t signaturesLength)
{
    const std::string *sigsBuffer = reinterpret_cast<const std::string *>(signatures);

    std::vector<std::string> sigs(sigsBuffer, sigsBuffer + signaturesLength);

    bool success = Core::Cryptography::completeRingSignatures(transactionSecretKey, realOutput, k, sigs);

    if (success)
    {
        signatures = reinterpret_cast<char *>(sigs.data());
    }

    return success;
}

inline int prepareRingSignatures(
    const char *prefixHash,
    const char *keyImage,
    const char *publicKeys,
    const uint64_t publicKeysLength,
    const uint64_t realOutput,
    char *&signatures,
    char *&k)
{
    const std::string *keysBuffer = reinterpret_cast<const std::string *>(publicKeys);

    std::vector<std::string> keys(keysBuffer, keysBuffer + publicKeysLength);

    std::vector<std::string> sigs;

    std::string kTemp;

    bool success = Core::Cryptography::prepareRingSignatures(prefixHash, keyImage, keys, realOutput, sigs, kTemp);

    if (success)
    {
        k = strdup(kTemp.c_str());

        signatures = reinterpret_cast<char *>(sigs.data());
    }

    return success;
}

inline void restoreKeyImage(
    const char *publicEphemeral,
    const char *derivation,
    const uint64_t output_index,
    const char *partialKeyImages,
    const uint64_t partialKeyImagesLength,
    char *&keyImage)
{
    const std::string *keysBuffer = reinterpret_cast<const std::string *>(partialKeyImages);

    std::vector<std::string> keys(keysBuffer, keysBuffer + partialKeyImagesLength);

    const std::string result = Core::Cryptography::restoreKeyImage(publicEphemeral, derivation, output_index, keys);

    keyImage = strdup(result.c_str());
}

inline int restoreRingSignatures(
    const char *derivation,
    const uint64_t output_index,
    const char *partialSigningKeys,
    const uint64_t partialSigningKeysLength,
    const uint64_t realOutput,
    const char *k,
    char *&signatures,
    const uint64_t signaturesLength)
{
    const std::string *keysBuffer = reinterpret_cast<const std::string *>(partialSigningKeys);

    std::vector<std::string> keys(keysBuffer, keysBuffer + partialSigningKeysLength);

    const std::string *sigsBuffer = reinterpret_cast<const std::string *>(signatures);

    std::vector<std::string> sigs(sigsBuffer, sigsBuffer + signaturesLength);

    bool success = Core::Cryptography::restoreRingSignatures(derivation, output_index, keys, realOutput, k, sigs);

    if (success)
    {
        signatures = reinterpret_cast<char *>(sigs.data());
    }

    return success;
}

inline void calculateMultisigPrivateKeys(
    const char *ourPrivateSpendKey,
    const char *publicKeys,
    const uint64_t publicKeysLength,
    char *&multisigKeys)
{
    const std::string *keysBuffer = reinterpret_cast<const std::string *>(publicKeys);

    std::vector<std::string> keys(keysBuffer, keysBuffer + publicKeysLength);

    std::vector<std::string> multisigKeysTemp =
        Core::Cryptography::calculateMultisigPrivateKeys(ourPrivateSpendKey, keys);

    multisigKeys = reinterpret_cast<char *>(multisigKeysTemp.data());
}

inline void calculateSharedPrivateKey(const char *secretKeys, const uint64_t secretKeysLength, char *&secretKey)
{
    const std::string *keysBuffer = reinterpret_cast<const std::string *>(secretKeys);

    std::vector<std::string> keys(keysBuffer, keysBuffer + secretKeysLength);

    const std::string result = Core::Cryptography::calculateSharedPrivateKey(keys);

    secretKey = strdup(result.c_str());
}

inline void calculateSharedPublicKey(const char *publicKeys, const uint64_t publicKeysLength, char *&publicKey)
{
    const std::string *keysBuffer = reinterpret_cast<const std::string *>(publicKeys);

    std::vector<std::string> keys(keysBuffer, keysBuffer + publicKeysLength);

    const std::string result = Core::Cryptography::calculateSharedPublicKey(keys);

    publicKey = strdup(result.c_str());
}
