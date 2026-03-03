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
    crypto-ops-data.cpp \
    aesb.c \
    blake256.c \
    groestl.c \
    hash-extra-blake.c \
    hash-extra-groestl.c \
    hash-extra-jh.c \
    hash-extra-skein.c \
    jh.c \
    oaes_lib.c \
    skein.c \
    slow-hash-arm.c \
    slow-hash-portable.c \
    slow-hash-x86.c \
    tree-hash.c
LOCAL_LDLIBS := -llog
LOCAL_CPPFLAGS += -fexceptions

include $(BUILD_SHARED_LIBRARY)
