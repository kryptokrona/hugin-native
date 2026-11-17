Pod::Spec.new do |s|
    s.name         = 'TurtleCoinModule'
    s.version      = '2.0.0'
    s.summary      = 'Platform module of the Hugin app'
    s.description  = 'Wallet sync data over HTTP and the VoIP launch payload for the Hugin app (NativeModules.TurtleCoin); the crypto functions come from kryptokrona-crypto'
    s.homepage     = 'https://kryptokrona.org/'
    s.license      = 'MIT'
    s.author       = { 'The Kryptokrona Developers' => 'info@kryptokrona.se' }
    s.source       = { git: 'https://github.com/kryptokrona/hugin-native.git' }
    s.platform     = :ios, '14.0'
    s.source_files = '*.{h,m}'
    s.requires_arc = true
    s.dependency 'React-Core'
    s.frameworks = 'Foundation'
    s.pod_target_xcconfig = {
        'OTHER_LDFLAGS' => '-ObjC'
      }
  end
