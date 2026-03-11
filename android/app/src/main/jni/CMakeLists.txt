cmake_minimum_required(VERSION 3.13)

project(appmodules)

# Bring in React Native's default New Architecture configuration so libappmodules.so
# is generated alongside our custom native library.
include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

# ReactNative-application.cmake only picks up *.cpp by default.
# Add C slow-hash sources explicitly so cn_turtle_lite_slow_hash_v2 links.
file(GLOB appmodules_c_SRC CONFIGURE_DEPENDS *.c)

# Select one slow-hash implementation per ABI.
list(REMOVE_ITEM appmodules_c_SRC
  "${CMAKE_CURRENT_SOURCE_DIR}/slow-hash-portable.c"
  "${CMAKE_CURRENT_SOURCE_DIR}/slow-hash-x86.c"
  "${CMAKE_CURRENT_SOURCE_DIR}/slow-hash-arm.c"
)

if(ANDROID_ABI STREQUAL "x86_64")
  list(APPEND appmodules_c_SRC "${CMAKE_CURRENT_SOURCE_DIR}/slow-hash-x86.c")
elseif(ANDROID_ABI STREQUAL "x86")
  list(APPEND appmodules_c_SRC "${CMAKE_CURRENT_SOURCE_DIR}/slow-hash-portable.c")
elseif(ANDROID_ABI STREQUAL "armeabi-v7a" OR ANDROID_ABI STREQUAL "arm64-v8a")
  list(APPEND appmodules_c_SRC "${CMAKE_CURRENT_SOURCE_DIR}/slow-hash-arm.c")
else()
  list(APPEND appmodules_c_SRC "${CMAKE_CURRENT_SOURCE_DIR}/slow-hash-portable.c")
endif()

add_library(appmodules_c_objects OBJECT ${appmodules_c_SRC})
target_include_directories(appmodules_c_objects PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})
set_target_properties(
    appmodules_c_objects
    PROPERTIES
    C_STANDARD 11
    C_STANDARD_REQUIRED ON
    C_EXTENSIONS OFF
)
if(ANDROID_ABI STREQUAL "x86_64")
  set_source_files_properties(
    "${CMAKE_CURRENT_SOURCE_DIR}/slow-hash-x86.c"
    PROPERTIES
    COMPILE_OPTIONS "-maes;-msse2"
  )
endif()
target_sources(${CMAKE_PROJECT_NAME} PRIVATE $<TARGET_OBJECTS:appmodules_c_objects>)

find_library(
    log-lib
    log
)

# Enable 16KB page size support
set(ANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES ON)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3 -fexceptions ")
set(
    CMAKE_SHARED_LINKER_FLAGS
    "${CMAKE_SHARED_LINKER_FLAGS} -Wl,-z,max-page-size=16384 -Wl,-z,common-page-size=16384"
)
set(
    CMAKE_EXE_LINKER_FLAGS
    "${CMAKE_EXE_LINKER_FLAGS} -Wl,-z,max-page-size=16384 -Wl,-z,common-page-size=16384"
)

