#import "AppDelegate.h"
#import "RNCallKeep.h"
#import <React/RCTBundleURLProvider.h>
#import <AVFoundation/AVFoundation.h> 
#import <TSBackgroundFetch/TSBackgroundFetch.h>
#import <Firebase.h>
#import <PushKit/PushKit.h>
#import "RNVoipPushNotificationManager.h"
#import <Security/Security.h>
#import <sodium-ios/sodium-lib.h>
#import <sodium-ios/crypto_box.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{

  [RNVoipPushNotificationManager voipRegistration];

  [FIRApp configure];
  self.moduleName = @"Hugin";
  self.initialProps = @{};

[RNCallKeep setup:@{
    @"appName": @"Hugin Messenger",
    @"maximumCallGroups": @3,
    @"maximumCallsPerCallGroup": @1,
    @"supportsVideo": @YES,
  }];

  [[TSBackgroundFetch sharedInstance] didFinishLaunching];

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

NSString* getEncryptionKeyFromKeychain() {
    NSString *account = @"encryption"; // Match JS username
    // No service attribute here since JS didn't set service

    NSDictionary *query = @{
        (__bridge id)kSecClass: (__bridge id)kSecClassGenericPassword,
        (__bridge id)kSecAttrAccount: account,
        (__bridge id)kSecReturnData: @YES
    };

    CFTypeRef result = NULL;
    OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &result);

    if (status == errSecSuccess) {
        NSData *passwordData = (__bridge_transfer NSData *)result;
        NSString *password = [[NSString alloc] initWithData:passwordData encoding:NSUTF8StringEncoding];
        NSLog(@"🔐 Keychain read success: %@", password);
        return password;
    } else {
        NSLog(@"🔐 Keychain read error: %d", (int)status);
        return nil;
    }
}

BOOL extractKeypairFromHex(NSString *hexKeypair, unsigned char *pk, unsigned char *sk) {
    NSUInteger expectedLength = (crypto_box_SECRETKEYBYTES + crypto_box_PUBLICKEYBYTES) * 2;
    if (hexKeypair.length != expectedLength) {
        NSLog(@"❌ Hex keypair should be %lu hex chars (%lu bytes)", (unsigned long)expectedLength, (unsigned long)(expectedLength/2));
        return NO;
    }

    unsigned char fullKey[crypto_box_SECRETKEYBYTES + crypto_box_PUBLICKEYBYTES];
    if (sodium_hex2bin(fullKey,
                       sizeof(fullKey),
                       [hexKeypair UTF8String],
                       hexKeypair.length,
                       NULL, NULL, NULL) != 0) {
        NSLog(@"❌ Failed to convert keypair hex to bytes");
        return NO;
    }

    // Since your hex keypair is: [sk | pk]
    memcpy(sk, fullKey, crypto_box_SECRETKEYBYTES);
    memcpy(pk, fullKey + crypto_box_SECRETKEYBYTES, crypto_box_PUBLICKEYBYTES);
    return YES;
}

NSString *hexFromBytes(const unsigned char *bytes, size_t length) {
    NSMutableString *hexString = [NSMutableString stringWithCapacity:length * 2];
    for (size_t i = 0; i < length; i++) {
        [hexString appendFormat:@"%02x", bytes[i]];
    }
    return [hexString copy];
}

void printKeypairHex(const unsigned char *pk, const unsigned char *sk) {
    NSString *skHex = hexFromBytes(sk, crypto_box_SECRETKEYBYTES);
    NSString *pkHex = hexFromBytes(pk, crypto_box_PUBLICKEYBYTES);

    NSLog(@"Secret Key Hex: %@", skHex);
    NSLog(@"Public Key Hex: %@", pkHex);
}

NSData* decryptSealedBox(NSData *sealedBox, NSString *hexKeypair) {
    if (sodium_init() < 0) {
        NSLog(@"❌ libsodium init failed");
        return nil;
    }

    // Prepare public and secret key buffers
    unsigned char pk[crypto_box_PUBLICKEYBYTES];
    unsigned char sk[crypto_box_SECRETKEYBYTES];

    if (!extractKeypairFromHex(hexKeypair, pk, sk)) {
        NSLog(@"❌ Key extraction failed");
        return nil;
    }

    printKeypairHex(pk, sk);

    if (sealedBox.length < crypto_box_SEALBYTES) {
        NSLog(@"❌ Ciphertext too short");
        return nil;
    }

    size_t messageLen = sealedBox.length - crypto_box_SEALBYTES;
    NSMutableData *decrypted = [NSMutableData dataWithLength:messageLen];

    const unsigned char *c_bytes = (const unsigned char *)[sealedBox bytes];
    unsigned char *m_bytes = (unsigned char *)[decrypted mutableBytes];

    int result = crypto_box_seal_open(m_bytes,
                                      c_bytes,
                                      (unsigned long long)sealedBox.length,
                                      pk,
                                      sk);

    if (result != 0) {
        NSLog(@"❌ Decryption failed");
        return nil;
    }

    return decrypted;
}



// void testSodiumEncryption() {
//     SodiumBridge *sodium = [[SodiumBridge alloc] init];
    
//     NSDictionary *keyPair = [sodium generateBoxKeyPair];
//     NSData *publicKey = keyPair[@"publicKey"];
//     NSData *secretKey = keyPair[@"secretKey"];
    
//     NSString *messageString = @"My Test Message";
//     NSData *messageData = [messageString dataUsingEncoding:NSUTF8StringEncoding];
    
//     NSData *encrypted = [sodium encryptMessage:messageData recipientPublicKey:publicKey];
    
//     NSData *decrypted = [sodium decryptMessage:encrypted recipientPublicKey:publicKey recipientSecretKey:secretKey];
    
//     NSString *decryptedString = [[NSString alloc] initWithData:decrypted encoding:NSUTF8StringEncoding];
    
//     NSLog(@"Decrypted message: %@", decryptedString);
// }

// NSData* decryptSealedBox(NSMutableData *ciphertext, NSString *hexPrivateKey) {
//     // Step 1: Convert hex private key to raw bytes
//     unsigned char sk[crypto_box_SECRETKEYBYTES];
//     if (sodium_hex2bin(sk,
//                        sizeof(sk),
//                        [hexPrivateKey UTF8String],
//                        hexPrivateKey.length,
//                        NULL, NULL, NULL) != 0) {
//         NSLog(@"❌ Invalid hex private key");
//         return nil;
//     }

//     // Step 2: Derive public key from private key
//     unsigned char pk[crypto_box_PUBLICKEYBYTES];
//     crypto_scalarmult_base(pk, sk);

//     // Step 3: Prepare buffer for decrypted message
//     size_t messageLen = ciphertext.length - crypto_box_SEALBYTES;
//     if (ciphertext.length < crypto_box_SEALBYTES) {
//         NSLog(@"❌ Ciphertext too short");
//         return nil;
//     }

//     NSMutableData *decrypted = [NSMutableData dataWithLength:messageLen];

//     // Step 4: Decrypt sealed box
//     if (crypto_box_seal_open(decrypted.mutableBytes,
//                              ciphertext.bytes,
//                              ciphertext.length,
//                              pk,
//                              sk) != 0) {
//         NSLog(@"❌ Decryption failed");
//         return nil;
//     }

//     return decrypted;
// }

NSData* dataFromHex(NSString *hexString) {
    NSMutableData *data = [NSMutableData dataWithCapacity:hexString.length / 2];
    const char *chars = [hexString UTF8String];
    char byteChars[3] = {'\0','\0','\0'};
    unsigned char wholeByte;

    for (int i = 0; i < hexString.length / 2; i++) {
        byteChars[0] = chars[i * 2];
        byteChars[1] = chars[i * 2 + 1];
        wholeByte = (unsigned char)strtol(byteChars, NULL, 16);
        [data appendBytes:&wholeByte length:1];
    }

    return data;
}

NSData* decodePayloadHex(NSString *payloadHex) {
    NSData *jsonData = dataFromHex(payloadHex);
    if (!jsonData) return nil;

    // Print JSON string in cleartext
    NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    if (jsonString) {
        NSLog(@"📦 Payload JSON: %@", jsonString);
    } else {
        NSLog(@"❌ Failed to convert JSON data to string");
    }

    NSError *error = nil;
    NSDictionary *payloadBox = [NSJSONSerialization JSONObjectWithData:jsonData options:0 error:&error];
    if (error || ![payloadBox isKindOfClass:[NSDictionary class]]) {
        NSLog(@"❌ Failed to parse JSON from payload_hex: %@", error.localizedDescription);
        return nil;
    }

    NSString *boxHex = payloadBox[@"box"];
    if (![boxHex isKindOfClass:[NSString class]]) {
        NSLog(@"❌ 'box' field is missing or not a string");
        return nil;
    }

    return dataFromHex(boxHex);
}



/* Add PushKit delegate method */

// --- Handle updated push credentials
- (void)pushRegistry:(PKPushRegistry *)registry didUpdatePushCredentials:(PKPushCredentials *)credentials forType:(PKPushType)type {
  // Register VoIP push token (a property of PKPushCredentials) with server
  [RNVoipPushNotificationManager didUpdatePushCredentials:credentials forType:(NSString *)type];
}

- (void)pushRegistry:(PKPushRegistry *)registry didInvalidatePushTokenForType:(PKPushType)type
{
  // --- The system calls this method when a previously provided push token is no longer valid for use. No action is necessary on your part to reregister the push type. Instead, use this method to notify your server not to send push notifications using the matching push token.
}

// --- Handle incoming pushes
- (void)pushRegistry:(PKPushRegistry *)registry didReceiveIncomingPushWithPayload:(PKPushPayload *)payload forType:(PKPushType)type withCompletionHandler:(void (^)(void))completion {

    NSError *audioError = nil;
  [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayAndRecord
                                   withOptions:AVAudioSessionCategoryOptionAllowBluetooth | AVAudioSessionCategoryOptionDefaultToSpeaker
                                         error:&audioError];

  if (audioError) {
    NSLog(@"Error setting AVAudioSession category: %@", audioError.localizedDescription);
  }

  [[AVAudioSession sharedInstance] setActive:YES error:&audioError];

  if (audioError) {
    NSLog(@"Error activating AVAudioSession: %@", audioError.localizedDescription);
  }

    NSString *hexKeypair = getEncryptionKeyFromKeychain(); // 64 hex chars
    NSData *sealedBox = decodePayloadHex(payload.dictionaryPayload[@"payload"]); // your sealed message as hex

    NSString *callerName = @"Anonymous";
    NSDictionary *callPayload = nil;

    if (sealedBox) {
        NSData *plaintext = decryptSealedBox(sealedBox, hexKeypair);
        if (plaintext) {
            NSError *jsonError = nil;
            NSDictionary *jsonDict = [NSJSONSerialization JSONObjectWithData:plaintext options:0 error:&jsonError];

            if (jsonError) {
                NSLog(@"❌ Failed to parse decrypted JSON: %@", jsonError.localizedDescription);
            } else {
                callPayload = jsonDict;
                NSString *name = jsonDict[@"name"];
                if ([name isKindOfClass:[NSString class]] && name.length > 0) {
                    callerName = name;
                    NSLog(@"📛 Extracted caller name: %@", callerName);
                } else {
                    NSLog(@"❌ 'name' field missing or invalid in decrypted JSON");
                }
            }
        } else {
            NSLog(@"❌ Decryption failed, no data");
        }
    }

  // --- Retrieve information from your voip push payload
  NSString *uuid = [[[NSUUID UUID] UUIDString] lowercaseString];
  NSString *handle = payload.dictionaryPayload[@"handle"];

  // --- this is optional, only required if you want to call `completion()` on the js side
  [RNVoipPushNotificationManager addCompletionHandler:uuid completionHandler:completion];

  // --- Process the received push
  [RNVoipPushNotificationManager didReceiveIncomingPushWithPayload:payload forType:(NSString *)type];

  // --- You should make sure to report to callkit BEFORE execute `completion()`
  [RNCallKeep reportNewIncomingCall:uuid
                           handle:handle
                       handleType:@"generic"
                         hasVideo:NO
              localizedCallerName:callerName
                  supportsHolding:YES
                     supportsDTMF:YES
                 supportsGrouping:YES
               supportsUngrouping:YES
                      fromPushKit:YES
                          payload:callPayload
            withCompletionHandler:nil];

    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    [defaults setObject:callPayload forKey:@"InitialVoipPayload"];
    [defaults synchronize];
  
  // --- You don't need to call it if you stored `completion()` and will call it on the js side.
  completion();
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@".expo/.virtual-metro-entry"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
