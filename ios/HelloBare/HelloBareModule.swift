import Foundation
import React

@objc(HelloBareModule)
class HelloBareModule: NSObject, RCTBridgeDelegate {

  @objc func install() {
    if let bridge = RCTBridge(delegate: self, launchOptions: nil) {
      HelloBare.sharedInstance().install(bridge: bridge)
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }

  // MARK: - RCTBridgeDelegate
  
  func sourceURL(for bridge: RCTBridge!) -> URL! {
    // Return the URL for your JS bundle
    return URL(string: "http://localhost:8081/index.bundle?platform=ios")
  }
}
