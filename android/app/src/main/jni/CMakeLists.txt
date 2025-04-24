cmake_minimum_required(VERSION 3.4.1)

# Source files
set(SOURCE_FILES
    Java.cpp
    crypto.cpp
    hash.cpp
    keccak.cpp
    StringTools.cpp
    kryptokrona.cpp
    multisig.cpp
    crypto-ops.cpp
    crypto-ops-data.cpp
)

# Create shared library
add_library(
    TurtleCoin_jni
    SHARED
    ${SOURCE_FILES}
)

# Find Android's logging library
find_library(
    log-lib
    log
)

# Set compile flags
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3 -fexceptions")

# Link libraries
target_link_libraries(
    TurtleCoin_jni
    ${log-lib}
)
