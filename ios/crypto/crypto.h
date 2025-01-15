// crypto.h

// Copyright (c) 2019-2025, The Kryptokrona Developers

#import <Foundation/Foundation.h>
#import "React/RCTBridgeModule.h"
#include "Types.h"
#include "CryptoTypes.h"
#include "StringTools.h"
#include "kryptokrona.h"

// Conversion utilities
std::vector<KeyOutput> parseKeyOutputs(NSArray *keyOutputsArray);
WalletBlockInfo convertWalletBlockInfo(NSDictionary *block);
NSArray *convertInputsToNSArray(const std::vector<std::tuple<Crypto::PublicKey, TransactionInput>> &inputs);
NSDictionary *transactionInputToNS(const TransactionInput &input);

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
                    realOutput:(NSInteger)realOutput
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

@end