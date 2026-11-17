// Copyright (c) 2019-2026, The Kryptokrona Developers

/*
 * The app's own platform module (NativeModules.TurtleCoin): the VoIP launch payload and wallet
 * sync data over HTTP. The crypto functions come from kryptokrona-crypto's KryptokronaCrypto
 * module (src/services/NativeTest.js).
 */

#import "TurtleCoinModule.h"

#import <React/RCTLog.h>

@implementation TurtleCoinModule

RCT_EXPORT_MODULE(TurtleCoin);

static long BLOCK_COUNT = 100;

RCT_EXPORT_METHOD(getInitialVoipPayload:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
    {
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    NSDictionary *payload = [defaults objectForKey:@"InitialVoipPayload"];

    if (payload != nil) {
        // Optionally clear it to avoid re-processing
        [defaults removeObjectForKey:@"InitialVoipPayload"];
        resolve(payload);
    } else {
        resolve(nil);
    }
    }


RCT_EXPORT_METHOD(getWalletSyncData:(NSArray<NSString *> *)blockHashCheckpoints
                  startHeight:(NSInteger)startHeight
                  startTimestamp:(NSInteger)startTimestamp
                  blockCount:(NSInteger)blockCount
                  skipCoinbaseTransactions:(BOOL)skipCoinbaseTransactions
                  url:(NSString *)url
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    if (blockCount < BLOCK_COUNT) {
        BLOCK_COUNT = blockCount;
    } else if (BLOCK_COUNT < 1) {
        BLOCK_COUNT = 1;
    }

    NSURL *requestURL = [NSURL URLWithString:url];
    if (!requestURL) {
        reject(@"invalid_url", @"The provided URL is invalid.", nil);
        return;
    }

    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:requestURL];
    [request setHTTPMethod:@"POST"];
    [request setValue:@"application/json; charset=UTF-8" forHTTPHeaderField:@"Content-Type"];
    [request setValue:@"application/json" forHTTPHeaderField:@"Accept"];
    [request setValue:@"hugin-messenger-v1.4.1" forHTTPHeaderField:@"User-Agent"];

    // Build JSON body
    NSMutableDictionary *jsonBody = [NSMutableDictionary dictionary];
    jsonBody[@"blockHashCheckpoints"] = blockHashCheckpoints;
    jsonBody[@"startHeight"] = @(startHeight);
    jsonBody[@"startTimestamp"] = @(startTimestamp);
    jsonBody[@"blockCount"] = @(blockCount);
    jsonBody[@"skipCoinbaseTransactions"] = @(skipCoinbaseTransactions);

    NSError *error = nil;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:jsonBody options:0 error:&error];
    if (error) {
        reject(@"json_error", @"Failed to serialize JSON body.", error);
        return;
    }

    [request setHTTPBody:jsonData];

    // Configure session
    NSURLSessionConfiguration *config = [NSURLSessionConfiguration defaultSessionConfiguration];
    config.timeoutIntervalForRequest = 4; // 4 seconds timeout
    NSURLSession *session = [NSURLSession sessionWithConfiguration:config];

    // Send request
    [[session dataTaskWithRequest:request
                completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
        if (error) {
            // Handle connection error
            resolve(@{ @"error": error.localizedDescription });
            return;
        }

        NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
        if (httpResponse.statusCode != 200) {
            NSString *errorMessage = [NSString stringWithFormat:@"Failed to fetch, response code: %ld", (long)httpResponse.statusCode];
            resolve(@{ @"error": errorMessage });
            return;
        }

        // Process response data
        NSString *responseString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
        if (!responseString) {
            resolve(@{ @"error": @"Failed to parse response data." });
            return;
        }

        // Check for large response sizes and retry logic
        if (BLOCK_COUNT > 1 && (responseString.length >= 2 * 1024 * 1024)) {
            BLOCK_COUNT /= 4;
            if (BLOCK_COUNT == 0) {
                BLOCK_COUNT = 1;
            }

            NSLog(@"Response too large, retrying with BLOCK_COUNT: %ld", BLOCK_COUNT);

            // Retry with reduced block count
            [self getWalletSyncData:blockHashCheckpoints
                             startHeight:startHeight
                         startTimestamp:startTimestamp
                             blockCount:BLOCK_COUNT
                 skipCoinbaseTransactions:skipCoinbaseTransactions
                                      url:url
                                  resolver:resolve
                                  rejecter:reject];
            return;
        }

        // Adjust BLOCK_COUNT for next request
        if (BLOCK_COUNT * 2 > 100) {
            BLOCK_COUNT = 100;
        } else {
            BLOCK_COUNT *= 2;
        }

        NSLog(@"Updating BLOCK_COUNT to: %ld", BLOCK_COUNT);
        NSLog(@"Response: %@", responseString);

        resolve(responseString);
    }] resume];
}

@end
