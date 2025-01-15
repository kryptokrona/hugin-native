
// Copyright (c) 2019-2025, The Kryptokrona Developers

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#include "Types.h"
#include "CryptoTypes.h"
#include "StringTools.h"
#include "kryptokrona.h"

@interface TurtleCoinModule : NSObject <RCTBridgeModule>
@end

@implementation TurtleCoinModule

RCT_EXPORT_MODULE(TurtleCoin);

static long BLOCK_COUNT = 100;

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
    config.timeoutIntervalForRequest = 10; // 10 seconds timeout
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

RCT_EXPORT_METHOD(generateRingSignatures:(NSString *)prefixHash
                  keyImage:(NSString *)keyImage
                  publicKeys:(NSArray<NSString *> *)publicKeys
                  transactionSecretKey:(NSString *)transactionSecretKey
                  realOutput:(NSInteger)realOutput
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    std::string cppPrefixHash = [prefixHash UTF8String];
    std::string cppKeyImage = [keyImage UTF8String];
    std::vector<std::string> cppPublicKeys;
    for (NSString *key in publicKeys) {
        cppPublicKeys.push_back([key UTF8String]);
    }
    std::string cppTransactionSecretKey = [transactionSecretKey UTF8String];
    uint64_t cppRealOutput = (uint64_t)realOutput;

    std::vector<std::string> cppSignatures;

    bool result = Cryptography::generateRingSignatures(
        cppPrefixHash,
        cppKeyImage,
        cppPublicKeys,
        cppTransactionSecretKey,
        cppRealOutput,
        cppSignatures
    );

    if (result) {

        NSMutableArray *signaturesArray = [NSMutableArray array];
        for (const auto &sig : cppSignatures) {
            [signaturesArray addObject:[NSString stringWithUTF8String:sig.c_str()]];
        }

        // Resolve the promise with the signatures array
        resolve(signaturesArray);
    } else {
        // Handle errors and reject the promise
        NSError *error = [NSError errorWithDomain:@"GenerateRingSignaturesError"
                                             code:1
                                         userInfo:@{NSLocalizedDescriptionKey: @"Failed to generate ring signatures"}];
        reject(@"generate_error", @"Failed to generate ring signatures", error);
    }
}

RCT_EXPORT_METHOD(checkRingSignature:(NSString *)prefixHash
                  keyImage:(NSString *)keyImage
                  publicKeys:(NSArray<NSString *> *)publicKeys
                  signatures:(NSArray<NSString *> *)signatures
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    std::string cppPrefixHash = [prefixHash UTF8String];
    std::string cppKeyImage = [keyImage UTF8String];

    std::vector<std::string> cppPublicKeys;
    for (NSString *key in publicKeys) {
        cppPublicKeys.push_back([key UTF8String]);
    }

    std::vector<std::string> cppSignatures;
    for (NSString *sig in signatures) {
        cppSignatures.push_back([sig UTF8String]);
    }

    bool result = Cryptography::checkRingSignature(
        cppPrefixHash,
        cppKeyImage,
        cppPublicKeys,
        cppSignatures
    );

    // Resolve the result back to JavaScript
    resolve(@(result));
}

RCT_EXPORT_METHOD(generateKeyDerivation:(NSString *)publicKey
                  privateKey:(NSString *)privateKey
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    std::string cppPublicKey = [publicKey UTF8String];
    std::string cppPrivateKey = [privateKey UTF8String];
    std::string cppDerivation; // Output variable

    bool success = Cryptography::generateKeyDerivation(cppPublicKey, cppPrivateKey, cppDerivation);

    if (success) {
        // Convert the C++ string back to NSString and resolve it
        resolve([NSString stringWithUTF8String:cppDerivation.c_str()]);
    } else {
        // Reject with an error message if the function fails
        NSError *error = [NSError errorWithDomain:@"KeyDerivationError"
                                             code:1
                                         userInfo:@{NSLocalizedDescriptionKey: @"Failed to generate key derivation"}];
        reject(@"key_derivation_failed", @"Failed to generate key derivation", error);
    }
}

RCT_EXPORT_METHOD(generateKeyImage:(NSString *)publicKey
                  privateKey:(NSString *)privateKey
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    // Convert Objective-C strings to C++ strings
    std::string cppPublicKey = [publicKey UTF8String];
    std::string cppPrivateKey = [privateKey UTF8String];

    try {
        std::string keyImage = Cryptography::generateKeyImage(cppPublicKey, cppPrivateKey);

        resolve([NSString stringWithUTF8String:keyImage.c_str()]);
    } catch (const std::exception &e) {
        // Handle any exceptions and reject the promise
        NSString *errorMessage = [NSString stringWithUTF8String:e.what()];
        NSError *error = [NSError errorWithDomain:@"KeyImageError"
                                             code:1
                                         userInfo:@{NSLocalizedDescriptionKey: errorMessage}];
        reject(@"key_image_failed", errorMessage, error);
    } catch (...) {
        // Handle unknown exceptions
        NSError *error = [NSError errorWithDomain:@"KeyImageError"
                                             code:2
                                         userInfo:@{NSLocalizedDescriptionKey: @"Unknown error occurred"}];
        reject(@"key_image_failed", @"Unknown error occurred", error);
    }
}

RCT_EXPORT_METHOD(deriveSecretKey:(NSString *)derivation
                  outputIndex:(nonnull NSNumber *)outputIndex
                  privateKey:(NSString *)privateKey
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    // Convert Objective-C types to C++ types
    std::string cppDerivation = [derivation UTF8String];
    uint64_t cppOutputIndex = [outputIndex unsignedLongLongValue];
    std::string cppPrivateKey = [privateKey UTF8String];

    try {
        std::string secretKey = Cryptography::deriveSecretKey(cppDerivation, cppOutputIndex, cppPrivateKey);

        resolve([NSString stringWithUTF8String:secretKey.c_str()]);
    } catch (const std::exception &e) {
        // Handle standard exceptions
        NSString *errorMessage = [NSString stringWithUTF8String:e.what()];
        NSError *error = [NSError errorWithDomain:@"DeriveSecretKeyError"
                                             code:1
                                         userInfo:@{NSLocalizedDescriptionKey: errorMessage}];
        reject(@"derive_secret_key_failed", errorMessage, error);
    } catch (...) {
        // Handle unknown exceptions
        NSError *error = [NSError errorWithDomain:@"DeriveSecretKeyError"
                                             code:2
                                         userInfo:@{NSLocalizedDescriptionKey: @"Unknown error occurred"}];
        reject(@"derive_secret_key_failed", @"Unknown error occurred", error);
    }
}

RCT_EXPORT_METHOD(derivePublicKey:(NSString *)derivation
                  outputIndex:(nonnull NSNumber *)outputIndex
                  publicKey:(NSString *)publicKey
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    // Convert Objective-C types to C++ types
    const char *cppDerivation = [derivation UTF8String];
    uint64_t cppOutputIndex = [outputIndex unsignedLongLongValue];
    const char *cppPublicKey = [publicKey UTF8String];
    char *cppOutPublicKey = nullptr;

    try {
        // Call the C++ function
        int result = Cryptography::derivePublicKey(cppDerivation, cppOutputIndex, cppPublicKey, cppOutPublicKey);

        if (result == 0) {
            // Convert the output public key to NSString
            NSString *outPublicKey = [NSString stringWithUTF8String:cppOutPublicKey];

            delete[] cppOutPublicKey;

            resolve(outPublicKey);
        } else {
            // Handle error if result is non-zero
            NSString *errorMessage = @"Failed to derive public key";
            NSError *error = [NSError errorWithDomain:@"DerivePublicKeyError"
                                                 code:result
                                             userInfo:@{NSLocalizedDescriptionKey: errorMessage}];
            reject(@"derive_public_key_failed", errorMessage, error);
        }
    } catch (const std::exception &e) {
        // Handle standard exceptions
        NSString *errorMessage = [NSString stringWithUTF8String:e.what()];
        NSError *error = [NSError errorWithDomain:@"DerivePublicKeyError"
                                             code:1
                                         userInfo:@{NSLocalizedDescriptionKey: errorMessage}];
        reject(@"derive_public_key_failed", errorMessage, error);
    } catch (...) {
        // Handle unknown exceptions
        NSError *error = [NSError errorWithDomain:@"DerivePublicKeyError"
                                             code:2
                                         userInfo:@{NSLocalizedDescriptionKey: @"Unknown error occurred"}];
        reject(@"derive_public_key_failed", @"Unknown error occurred", error);
    }
}

RCT_EXPORT_METHOD(cnFastHash:(NSString *)input
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {

    std::string cppInput = [input UTF8String];

    try {
        std::string cppHash = Cryptography::cn_fast_hash(cppInput);

        NSString *hash = [NSString stringWithUTF8String:cppHash.c_str()];

        resolve(hash);
    } catch (const std::exception &e) {
        // Handle standard exceptions
        NSString *errorMessage = [NSString stringWithUTF8String:e.what()];
        NSError *error = [NSError errorWithDomain:@"FastHashError"
                                             code:1
                                         userInfo:@{NSLocalizedDescriptionKey: errorMessage}];
        reject(@"cn_fast_hash_failed", errorMessage, error);
    } catch (...) {
        // Handle unknown exceptions
        NSError *error = [NSError errorWithDomain:@"FastHashError"
                                             code:2
                                         userInfo:@{NSLocalizedDescriptionKey: @"Unknown error occurred"}];
        reject(@"cn_fast_hash_failed", @"Unknown error occurred", error);
    }
}

RCT_EXPORT_METHOD(processBlockOutputs:(NSDictionary *)block
                  privateViewKey:(NSString *)privateViewKey
                  spendKeys:(NSDictionary *)spendKeys
                  isViewWallet:(BOOL)isViewWallet
                  processCoinbaseTransactions:(BOOL)processCoinbaseTransactions
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    WalletBlockInfo cppBlockInfo = convertWalletBlockInfo(block);

    std::string cppPrivateViewKey = [privateViewKey UTF8String];

    std::unordered_map<Crypto::PublicKey, Crypto::SecretKey> cppSpendKeys;
    for (const auto &key : spendKeys) {
        NSString *publicKey = key.first;
        NSString *secretKey = key.second;
        
        Crypto::PublicKey cppPublicKey;
        Crypto::SecretKey cppSecretKey;
        
        Common::podFromHex([publicKey UTF8String], cppPublicKey);
        Common::podFromHex([secretKey UTF8String], cppSecretKey);
        
        cppSpendKeys[cppPublicKey] = cppSecretKey;
    }

    // Call the C++ function
    try {
        inputs = processBlockOutputs(
            cppBlockInfo,
            cppPrivateViewKey,
            cppSpendKeys,
            isViewWallet,
            processCoinbaseTransactions);

        NSArray parsedInputs = convertInputsToNSArray(inputs);

        resolve(parsedInputs);
        
    } catch (const std::exception &e) {
        // Handle C++ exceptions gracefully
        NSString *errorMessage = [NSString stringWithUTF8String:e.what()];
        NSError *error = [NSError errorWithDomain:@"processBlockOutputsError"
                                             code:1
                                         userInfo:@{NSLocalizedDescriptionKey: errorMessage}];
        reject(@"process_block_outputs_failed", errorMessage, error);
    } catch (...) {
        // Handle unknown exceptions
        NSError *error = [NSError errorWithDomain:@"processBlockOutputsError"
                                             code:2
                                         userInfo:@{NSLocalizedDescriptionKey: @"Unknown error occurred"}];
        reject(@"process_block_outputs_failed", @"Unknown error occurred", error);
    }
}

@end

///---- Conversion functions ----///

// Convert TransactionInput to NS
NSDictionary *transactionInputToNS(const TransactionInput &input) {
    Common::podToHex(input.key);
    Common::podToHex(input.keyImage);
  return @{
    @"keyImage": [NSString stringWithUTF8String:input.keyImage.c_str()], 
    @"amount": @(input.amount), 
    @"transactionIndex": @(input.transactionIndex), 
    @"globalOutputIndex": @(input.globalOutputIndex),
    @"key": [NSString stringWithUTF8String:input.key.c_str()], 
    @"parentTransactionHash": [NSString stringWithUTF8String:input.parentTransactionHash.c_str()]
};
}

// Convert std::vector<std::tuple<PublicKey, TransactionInput>> to NSArray
NSArray *convertInputsToNSArray(const std::vector<std::tuple<Crypto::PublicKey, TransactionInput>> &inputs) {
    NSMutableArray *result = [NSMutableArray array];

    for (const auto &[publicSpendKey, input] : inputs) {
        Common::podToHex(publicSpendKey);
        [result addObject:@{
            @"publicSpendKey": [NSString stringWithUTF8String:publicSpendKey.c_str()],
            @"input": transactionInputToNS(input)
        }];
    }

    return result;
}

// Parse blockinfo from JS -> C++ types
WalletBlockInfo convertWalletBlockInfo(NSDictionary *block) {
    WalletBlockInfo walletBlockInfo;

    // Parse Coinbase Transaction
    NSDictionary *coinbaseTransaction = block[@"coinbaseTransaction"];
    if (coinbaseTransaction && ![coinbaseTransaction isEqual:[NSNull null]]) {
        RawTransaction coinbaseTransaction;

        // Convert NSString to const char*
        const char *publicKeyHex = [coinbaseTransaction[@"transactionPublicKey"] UTF8String];
        Crypto::PublicKey publicKey = Crypto::PublicKey();
        Common::podFromHex(publicKeyHex, publicKey);

        coinbaseTransaction.keyOutputs = parseKeyOutputs(coinbaseTransaction[@"keyOutputs"]);
        coinbaseTransaction.hash = [coinbaseTransaction[@"hash"] UTF8String];
        coinbaseTransaction.transactionPublicKey = publicKey;

        walletBlockInfo.coinbaseTransaction = coinbaseTransaction;
    }

    // Parse Transactions
    NSArray *transactionsArray = block[@"transactions"];
    for (NSDictionary *tx in transactionsArray) {
        RawTransaction transaction;
        
        Crypto::PublicKey publicKey = Crypto::PublicKey();
        const char *publicKeyHex = [tx[@"transactionPublicKey"] UTF8String];
        Common::podFromHex(publicKeyHex, publicKey);

        transaction.keyOutputs = parseKeyOutputs(tx[@"keyOutputs"]);
        transaction.hash = [tx[@"hash"] UTF8String];
        transaction.transactionPublicKey = publicKey;

        walletBlockInfo.transactions.push_back(transaction);
    }

    return walletBlockInfo;
}

// Parse Key Outputs
std::vector<KeyOutput> parseKeyOutputs(NSArray *keyOutputsArray) {
    std::vector<KeyOutput> keyOutputs;

    for (NSDictionary *keyOutputs in keyOutputsArray) {
        KeyOutput keyOutput;

        Crypto::PublicKey key = Crypto::PublicKey();
        Common::podFromHex(keyOutputs[@"key"], key);

        keyOutput.key = key;
        keyOutput.amount = [keyOutputs[@"amount"] unsignedLongLongValue];
        keyOutput.globalIndex = [keyOutputs[@"globalIndex"] longLongValue];

        keyOutputs.push_back(keyOutput);
    }

    return keyOutputs;
}


///---- Conversion functions ----///