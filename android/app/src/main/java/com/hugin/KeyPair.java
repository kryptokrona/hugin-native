package com.hugin;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

public class KeyPair {
    public String publicKey;
    public String privateKey;

    public KeyPair(String publicKey, String privateKey) {
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }
}