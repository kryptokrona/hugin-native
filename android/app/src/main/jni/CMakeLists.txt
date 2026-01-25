cmake_minimum_required(VERSION 3.13)

project(appmodules)

# Bring in React Native's default New Architecture configuration so libappmodules.so
# is generated alongside our custom native library.
include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

find_library(
    log-lib
    log
)


set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3 -fexceptions ")
set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -Wl,-z,max-page-size=16384")

