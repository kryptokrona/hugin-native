package com.huginmessenger;
import android.content.res.Configuration;
import expo.modules.ApplicationLifecycleDispatcher;
import expo.modules.ReactNativeHostWrapper;

import com.huginmessenger.BuildConfig;
import com.transistorsoft.rnbackgroundfetch.RNBackgroundFetchPackage;
import android.app.Application;
import android.content.Intent;
import android.util.Log;
import com.facebook.react.PackageList;
import com.facebook.hermes.reactexecutor.HermesExecutorFactory;
import com.facebook.hermes.reactexecutor.HermesExecutor;
import com.facebook.react.bridge.JavaScriptExecutorFactory;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.modules.network.OkHttpClientFactory;
import com.facebook.react.modules.network.OkHttpClientProvider;
import com.facebook.react.soloader.OpenSourceMergedSoMapping;
import com.facebook.soloader.SoLoader;
import java.util.List;
import java.io.IOException;
import com.zxcpoiu.incallmanager.InCallManagerPackage;
import com.facebook.react.defaults.DefaultReactNativeHost;
import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Response;
import okhttp3.Request;

import to.holepunch.bare.kit.react.BareKitPackage;

public class MainApplication extends Application implements ReactApplication {
  private final ReactNativeHost mReactNativeHost = new ReactNativeHostWrapper(this, new DefaultReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }
  

  public boolean isNewArchEnabled() {
    return Boolean.TRUE;
  }


    @Override
    protected List<ReactPackage> getPackages() {
      List<ReactPackage> packages = new PackageList(this).getPackages();
      Log.d("ReactNative", "Initial packages: " + packages.toString());
      // Packages that cannot be autolinked yet can be added manually here
      packages.add(new TurtleCoinPackage());
      packages.add(new RNBackgroundFetchPackage());
      packages.add(new BareKitPackage());
      // packages.add( new InCallManagerPackage());
      return packages;
    }

    @Override
    protected String getJSMainModuleName() {
        return "index.js";
    }

  });


  @Override
  public ReactNativeHost getReactNativeHost() {
    
    return mReactNativeHost;
  }


  @Override
  public void onCreate() {
    super.onCreate();

    /* tonchan-vx.x.x */
    setUserAgent("hugin-messenger-v2.0.0");

    try {
    SoLoader.init(this, OpenSourceMergedSoMapping.INSTANCE);
    } catch (IOException e) {
      e.printStackTrace();
    }

    ApplicationLifecycleDispatcher.onApplicationCreate(this);
  }

  public void setUserAgent(String userAgent) {
    OkHttpClientProvider.setOkHttpClientFactory(new UserAgentClientFactory(userAgent));
  }


  @Override
  public void onConfigurationChanged(Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig);
  }
}

class UserAgentInterceptor implements Interceptor {

    String userAgent;

    public UserAgentInterceptor(String userAgent) {
        this.userAgent = userAgent;
    }

    @Override
    public Response intercept(Interceptor.Chain chain) throws IOException {
        Request originalRequest = chain.request();
        Request correctRequest = originalRequest.newBuilder()
            .removeHeader("User-Agent")
            .addHeader("User-Agent", this.userAgent)
            .build();

        return chain.proceed(correctRequest);
    }
}

class UserAgentClientFactory implements OkHttpClientFactory {

    String userAgent;

    public UserAgentClientFactory(String userAgent) {
        this.userAgent = userAgent;
    }

    @Override
    public OkHttpClient createNewNetworkModuleClient() {
        return com.facebook.react.modules.network.OkHttpClientProvider.createClientBuilder()
                  .addInterceptor(new UserAgentInterceptor(this.userAgent)).build();
    }
}