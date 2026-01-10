package com.hugin

import android.app.Application
import android.content.res.Configuration
import android.util.Log
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.modules.network.OkHttpClientFactory
import com.facebook.react.modules.network.OkHttpClientProvider
import com.transistorsoft.rnbackgroundfetch.RNBackgroundFetchPackage
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import com.facebook.soloader.SoLoader
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load

class MainApplication : Application(), ReactApplication {

    private val mReactNativeHost: ReactNativeHost =
        ReactNativeHostWrapper(
            this,
            object : DefaultReactNativeHost(this) {

                override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

                override fun getPackages(): List<ReactPackage> {
                    val packages = PackageList(this).packages.toMutableList()
                    packages.add(TurtleCoinPackage())
                    packages.add(RNBackgroundFetchPackage())
                    return packages
                }

                override fun getJSMainModuleName(): String = "index"
            }
        )

    override val reactNativeHost: ReactNativeHost
        get() = mReactNativeHost

    override val reactHost: ReactHost
        get() = ReactNativeHostWrapper.createReactHost(applicationContext, mReactNativeHost)

    override fun onCreate() {
        super.onCreate()

        SoLoader.init(this, OpenSourceMergedSoMapping)
        // Install global User-Agent
        setUserAgent("hugin-messenger-v2.0.0")
         if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
        // If you opted-in for the New Architecture, we load the native entry point for this app.
        load()
    }

        ApplicationLifecycleDispatcher.onApplicationCreate(this)
    }

    private fun setUserAgent(userAgent: String) {
        OkHttpClientProvider.setOkHttpClientFactory(UserAgentClientFactory(userAgent))
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
    }
}

class UserAgentInterceptor(private val userAgent: String) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val newRequest = chain.request()
            .newBuilder()
            .removeHeader("User-Agent")
            .addHeader("User-Agent", userAgent)
            .build()

        return chain.proceed(newRequest)
    }
}

class UserAgentClientFactory(private val userAgent: String) : OkHttpClientFactory {
    override fun createNewNetworkModuleClient(): OkHttpClient {
        return OkHttpClientProvider.createClientBuilder()
            .addInterceptor(UserAgentInterceptor(userAgent))
            .build()
    }
}
