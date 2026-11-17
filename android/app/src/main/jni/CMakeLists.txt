cmake_minimum_required(VERSION 3.13)

project(appmodules)

# React Native's default New Architecture configuration (libappmodules.so with OnLoad.cpp and
# the autolinked C++ modules, among them kryptokrona-crypto's KryptokronaCrypto).
include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

# Enable 16KB page size support
set(ANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES ON)

set(
    CMAKE_SHARED_LINKER_FLAGS
    "${CMAKE_SHARED_LINKER_FLAGS} -Wl,-z,max-page-size=16384 -Wl,-z,common-page-size=16384"
)
set(
    CMAKE_EXE_LINKER_FLAGS
    "${CMAKE_EXE_LINKER_FLAGS} -Wl,-z,max-page-size=16384 -Wl,-z,common-page-size=16384"
)
