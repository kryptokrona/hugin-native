package com.hugin;

import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * The app's own platform module (NativeModules.TurtleCoin): wallet sync data over HTTP and the
 * battery optimisation settings. The crypto functions come from kryptokrona-crypto's
 * KryptokronaCrypto module (src/services/NativeTest.js).
 */
public class TurtleCoinModule extends ReactContextBaseJavaModule {
    public TurtleCoinModule(ReactApplicationContext reactContext) {
        super(reactContext); //required by React Native
    }

    /* Access this by doing NativeModules.TurtleCoin in react */
    @Override
    public String getName() {
        return "TurtleCoin";
    }

    @ReactMethod
    public void getWalletSyncData(
        ReadableArray blockHashCheckpointsJS,
        final double startHeight,
        final double startTimestamp,
        final double blockCount,
        final boolean skipCoinbaseTransactions,
        final String url,
        final Promise promise) {

        final String[] blockHashCheckpoints = new String[blockHashCheckpointsJS.size()];

        for (int i = 0; i < blockHashCheckpointsJS.size(); i++) {
            blockHashCheckpoints[i] = blockHashCheckpointsJS.getString(i);
        }

        new Thread(new Runnable() {
            public void run() {
                getWalletSyncDataImpl(
                    blockHashCheckpoints,
                    (long)startHeight,
                    (long)startTimestamp,
                    (long)blockCount,
                    skipCoinbaseTransactions,
                    url,
                    promise
                );
            }
        }).start();
    }

    @ReactMethod
    public void navigateToBatteryOptimizationScreen(Promise promise) {
        Intent myIntent = new Intent();

        myIntent.setAction(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
        myIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        getReactApplicationContext().startActivity(myIntent);

        promise.resolve("");
    }

    @ReactMethod
    public void isDozeDisabled(Promise promise) {
        PowerManager pm = (PowerManager)getReactApplicationContext().getSystemService(Context.POWER_SERVICE);
        promise.resolve(pm.isIgnoringBatteryOptimizations(getReactApplicationContext().getPackageName()));
    }

    private static long BLOCK_COUNT = 100;

    private void getWalletSyncDataImpl(
        String[] blockHashCheckpoints,
        long startHeight,
        long startTimestamp,
        long blockCount,
        boolean skipCoinbaseTransactions,
        String url,
        Promise promise) {

        /* If the user has specified < 100 per request */
        if (blockCount < BLOCK_COUNT)
        {
            BLOCK_COUNT = blockCount;
        }
        else if (BLOCK_COUNT < 1)
        {
            BLOCK_COUNT = 1;
        }

        try
        {
            URL obj = new URL(url);
            HttpURLConnection connection = (HttpURLConnection) obj.openConnection();

            /* 10 second timeout */
            connection.setConnectTimeout(4000);

            /* We're sending a JSON post */
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            connection.setRequestProperty("Accept", "application/json");

            /* tonchan-vx.x.x */
            connection.setRequestProperty("User-Agent", "hugin-messenger-v1.4.1");

            /* Indicate we have a POST body */
            connection.setDoOutput(true);

            DataOutputStream wr = new DataOutputStream(connection.getOutputStream());

            JSONObject json = new JSONObject();

            JSONArray checkpoints = new JSONArray();

            for (int i = 0; i < blockHashCheckpoints.length; i++)
            {
                checkpoints.put(blockHashCheckpoints[i]);
            }

            json.put("blockHashCheckpoints", checkpoints);

            json.put("startHeight", startHeight);
            json.put("startTimestamp", startTimestamp);
            json.put("blockCount", blockCount);
            json.put("skipCoinbaseTransactions", skipCoinbaseTransactions);

            String params = json.toString();

            Log.d("ReactNative", "Making request to /getwalletsyncdata with params " + params);

            wr.writeBytes(params);
            wr.flush();
            wr.close();

            int responseCode = connection.getResponseCode();

            if (responseCode != 200)
            {
                Log.i("ReactNative", "Failed to fetch, response code: " + responseCode);
                throw new Exception("Failed to fetch, response code: " + responseCode);
            }

            int oneMegaByte = 1024 * 1024;

            BufferedReader in = new BufferedReader(
                new InputStreamReader(connection.getInputStream(), "UTF-8"),
                oneMegaByte
            );

            StringBuffer response = new StringBuffer();

            char[] inputBuffer = new char[8192];

            int len = 0;

            while ((len = in.read(inputBuffer)) != -1)
            {
                /* Need block count to be > 1 otherwise we will never sync a single block > 2MB */
                if (BLOCK_COUNT > 1 && (response.length() >= (2 * oneMegaByte) || len >= 2 * oneMegaByte))
                {
                    in.close();

                    BLOCK_COUNT /= 4;

                    if (BLOCK_COUNT == 0)
                    {
                        BLOCK_COUNT = 1;
                    }

                    Log.i("ReactNative", "Response too large, trying again with block count of " + BLOCK_COUNT);

                    /* Response too large: try again with a quarter of the block count */
                    getWalletSyncDataImpl(
                        blockHashCheckpoints,
                        startHeight,
                        startTimestamp,
                        BLOCK_COUNT,
                        skipCoinbaseTransactions,
                        url,
                        promise
                    );

                    return;
                }

                response.append(new String(inputBuffer, 0, len));
            }

            if (BLOCK_COUNT * 2 > 100)
            {
                BLOCK_COUNT = 100;
            }
            else
            {
                BLOCK_COUNT *= 2;
            }

            Log.d("ReactNative", "Updating block count to " + BLOCK_COUNT);

            in.close();

            String responseData = response.toString();

            Log.d("ReactNative", "Got response from /getwalletsyncdata with body " + responseData);

            promise.resolve(responseData);
        }
        catch (Exception e)
        {
            WritableMap map = Arguments.createMap();
            map.putString("error", e.getMessage());

            Log.i("ReactNative", "Failed to fetch, error: " + e.getMessage());

            promise.resolve(map);
        }
    }
}
