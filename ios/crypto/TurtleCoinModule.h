// crypto.h

// Copyright (c) 2019-2025, The Kryptokrona Developers

#ifdef __OBJC__
#import <Foundation/Foundation.h>
#import "React/RCTBridgeModule.h"
#endif
#include "Types.h"
#include "CryptoTypes.h"
#include "StringTools.h"
#include "kryptokrona.h"
#include <unordered_map>

// Conversion utilities
std::vector<KeyOutput> parseKeyOutputs(NSArray *keyOutputsArray);
WalletBlockInfo convertWalletBlockInfo(NSDictionary *block);
NSArray *convertInputsToNSArray(const std::vector<std::tuple<Crypto::PublicKey, TransactionInput>> &inputs);
NSDictionary *transactionInputToNS(const TransactionInput &input);

std::vector<std::tuple<Crypto::PublicKey, TransactionInput>> processBlockOutputsiOS(
    const WalletBlockInfo &block,
    const Crypto::SecretKey &privateViewKey,
    const std::unordered_map<Crypto::PublicKey, Crypto::SecretKey> &spendKeys,
    const bool isViewWallet,
    const bool processCoinbaseTransactions);

@interface TurtleCoinModule : NSObject <RCTBridgeModule>

// Method declarations
- (void)getWalletSyncData:(NSArray<NSString *> *)blockHashCheckpoints
                 startHeight:(NSInteger)startHeight
              startTimestamp:(NSInteger)startTimestamp
                  blockCount:(NSInteger)blockCount
    skipCoinbaseTransactions:(BOOL)skipCoinbaseTransactions
                         url:(NSString *)url
                    resolver:(RCTPromiseResolveBlock)resolve
                    rejecter:(RCTPromiseRejectBlock)reject;

- (void)generateRingSignatures:(NSString *)prefixHash
                      keyImage:(NSString *)keyImage
                    publicKeys:(NSArray<NSString *> *)publicKeys
          transactionSecretKey:(NSString *)transactionSecretKey
                    realOutput:(NSDictionary *)realOutput
                      resolver:(RCTPromiseResolveBlock)resolve
                      rejecter:(RCTPromiseRejectBlock)reject;

- (void)checkRingSignature:(NSString *)prefixHash
                  keyImage:(NSString *)keyImage
                publicKeys:(NSArray<NSString *> *)publicKeys
                signatures:(NSArray<NSString *> *)signatures
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject;

- (void)generateKeyDerivation:(NSString *)publicKey
                   privateKey:(NSString *)privateKey
                     resolver:(RCTPromiseResolveBlock)resolve
                     rejecter:(RCTPromiseRejectBlock)reject;

- (void)generateKeyImage:(NSString *)publicKey
              privateKey:(NSString *)privateKey
                resolver:(RCTPromiseResolveBlock)resolve
                rejecter:(RCTPromiseRejectBlock)reject;

- (void)deriveSecretKey:(NSString *)derivation
            outputIndex:(nonnull NSNumber *)outputIndex
             privateKey:(NSString *)privateKey
               resolver:(RCTPromiseResolveBlock)resolve
               rejecter:(RCTPromiseRejectBlock)reject;

- (void)derivePublicKey:(NSString *)derivation
            outputIndex:(nonnull NSNumber *)outputIndex
              publicKey:(NSString *)publicKey
               resolver:(RCTPromiseResolveBlock)resolve
               rejecter:(RCTPromiseRejectBlock)reject;

- (void)cnFastHash:(NSString *)input
          resolver:(RCTPromiseResolveBlock)resolve
          rejecter:(RCTPromiseRejectBlock)reject;

- (void)processBlockOutputs:(NSDictionary *)block
                 privateViewKey:(NSString *)privateViewKey
                      spendKeys:(NSDictionary *)spendKeys
                   isViewWallet:(BOOL)isViewWallet
    processCoinbaseTransactions:(BOOL)processCoinbaseTransactions
                       resolver:(RCTPromiseResolveBlock)resolve
                       rejecter:(RCTPromiseRejectBlock)reject;

- (void)scReduce32:(NSString *)input
          resolver:(RCTPromiseResolveBlock)resolve
          rejecter:(RCTPromiseRejectBlock)reject;

- (void)secretKeyToPublicKey:(NSString *)privateKey
                    resolver:(RCTPromiseResolveBlock)resolve
                    rejecter:(RCTPromiseRejectBlock)reject;

- (void)checkKey:(NSString *)publicKey
        resolver:(RCTPromiseResolveBlock)resolve
        rejecter:(RCTPromiseRejectBlock)reject;

- (void)hashToEllipticCurve:(NSString *)hash
                   resolver:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject;

- (void)generateSignature:(NSString *)prefixHash
                publicKey:(NSString *)publicKey
               privateKey:(NSString *)privateKey
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject;

- (void)checkSignature:(NSString *)prefixHash
             publicKey:(NSString *)publicKey
             signature:(NSString *)signature
              resolver:(RCTPromiseResolveBlock)resolve
              rejecter:(RCTPromiseRejectBlock)reject;

- (void)hashToScalar:(NSString *)hash
            resolver:(RCTPromiseResolveBlock)resolve
            rejecter:(RCTPromiseRejectBlock)reject;

- (void)underivePublicKey:(NSString *)derivation
              outputIndex:(nonnull NSNumber *)outputIndex
               derivedKey:(NSString *)derivedKey
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject;

- (void)generateKeys:(RCTPromiseResolveBlock)resolve
            rejecter:(RCTPromiseRejectBlock)reject;

- (void)generateDeterministicSubwalletKeys:(NSString *)basePrivateKey
                               walletIndex:(NSNumber *)walletIndex
                                  resolver:(RCTPromiseResolveBlock)resolve
                                  rejecter:(RCTPromiseRejectBlock)reject;

@end
