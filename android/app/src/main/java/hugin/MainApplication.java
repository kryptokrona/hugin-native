package com.hugin;
import android.content.res.Configuration;
import expo.modules.ApplicationLifecycleDispatcher;
import expo.modules.ReactNativeHostWrapper;

import com.hugin.BuildConfig;

import android.app.Application;
import android.content.Intent;
import android.util.Log;

import com.facebook.react.PackageList;
import com.facebook.hermes.reactexecutor.HermesExecutorFactory;
import com.facebook.react.bridge.JavaScriptExecutorFactory;
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.modules.network.OkHttpClientFactory;
import com.facebook.react.modules.network.OkHttpClientProvider;
import com.facebook.soloader.SoLoader;
import io.csie.kudo.reactnative.v8.executor.V8ExecutorFactory;
import java.util.List;
import java.io.IOException;

import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Response;
import okhttp3.Request;

public class MainApplication extends Application implements ReactApplication {
  private final ReactNativeHost mReactNativeHost = new ReactNativeHostWrapper(this, new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      List<ReactPackage> packages = new PackageList(this).getPackages();
      // Packages that cannot be autolinked yet can be added manually here
      packages.add(new TurtleCoinPackage());
      return packages;
    }

    @Override
    protected String getJSMainModuleName() {
        return "index";
    }

    @Override
    protected JavaScriptExecutorFactory getJavaScriptExecutorFactory() {
        return new V8ExecutorFactory(
            getApplicationContext(),
            getPackageName(),
            AndroidInfoHelpers.getFriendlyDeviceName(),              
            getUseDeveloperSupport());
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

    SoLoader.init(this, /* native exopackage */ false);
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