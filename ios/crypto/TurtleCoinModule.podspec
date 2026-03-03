Pod::Spec.new do |s|
    s.name         = 'TurtleCoinModule'
    s.version      = '1.0.0'
    s.summary      = 'A module for TurtleCoin integration'
    s.description  = 'Provides TurtleCoin integration for the Hugin app'
    s.homepage     = 'https://kryptokrona.org/'
    s.license      = 'MIT'
    s.author       = { 'The Kryptokrona Developers' => 'info@kryptokrona.se' }
    s.source       = { git: 'https://github.com/kryptokrona/hugin-native.git' }
    s.platform     = :ios, '14.0'
    s.source_files = '*.{mm,h,cpp,c}'
    s.requires_arc = true
    s.dependency 'React-Core'
    s.frameworks = 'Foundation'
    s.pod_target_xcconfig = {
        'CLANG_CXX_LANGUAGE_STANDARD' => 'c++17',
        'CLANG_CXX_LIBRARY' => 'libc++',
        'GCC_C_LANGUAGE_STANDARD' => 'c11',
        # Simulator builds should use portable slow-hash to avoid x86/AES
        # intrinsic target-feature mismatches.
        'OTHER_CFLAGS[sdk=iphonesimulator*]' => '$(inherited) -DNO_AES',
        'OTHER_CPLUSPLUSFLAGS' => '-std=c++17',
        'OTHER_LDFLAGS' => '-ObjC'
      }
  end