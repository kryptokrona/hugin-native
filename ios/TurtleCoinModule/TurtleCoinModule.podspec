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
    s.source_files = '*.{mm,h,cpp}'
    s.requires_arc = true
    s.dependency 'React-Core'
    s.frameworks = 'Foundation'
  end