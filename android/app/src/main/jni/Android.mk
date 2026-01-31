LOCAL_PATH := $(call my-dir)

# ===============================
# TurtleCoin_jni Module
# ===============================
include $(CLEAR_VARS)
LOCAL_MODULE := TurtleCoin_jni
LOCAL_SRC_FILES := \
    Java.cpp \
    crypto.cpp \
    hash.cpp \
    keccak.cpp \
    StringTools.cpp \
    kryptokrona.cpp \
    multisig.cpp \
    crypto-ops.cpp \
    crypto-ops-data.cpp
LOCAL_LDLIBS := -llog
LOCAL_CPPFLAGS += -fexceptions

include $(BUILD_SHARED_LIBRARY)
