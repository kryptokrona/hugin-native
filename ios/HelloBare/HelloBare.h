// HelloBare.h
#import <React/RCTBridgeModule.h>

@interface HelloBare : NSObject <RCTBridgeModule>
+ (instancetype)sharedInstance;
- (void)install:(nullable RCTBridge *)bridge;
@end

