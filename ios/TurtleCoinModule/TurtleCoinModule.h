// Copyright (c) 2019-2026, The Kryptokrona Developers

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface TurtleCoinModule : NSObject <RCTBridgeModule>

- (void)getInitialVoipPayload:(RCTPromiseResolveBlock)resolve
                     rejecter:(RCTPromiseRejectBlock)reject;

- (void)getWalletSyncData:(NSArray<NSString *> *)blockHashCheckpoints
                 startHeight:(NSInteger)startHeight
              startTimestamp:(NSInteger)startTimestamp
                  blockCount:(NSInteger)blockCount
    skipCoinbaseTransactions:(BOOL)skipCoinbaseTransactions
                         url:(NSString *)url
                    resolver:(RCTPromiseResolveBlock)resolve
                    rejecter:(RCTPromiseRejectBlock)reject;

@end
