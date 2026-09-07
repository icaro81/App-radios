package com.radiocristal.app;

import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.os.Bundle;
import android.os.PowerManager;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Prevent Android TV Screen Saver / Ambient Mode from activating during app execution
        try {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        } catch (Exception e) {
            e.printStackTrace();
        }

        // 2. Acquire Partial Wake Lock for uninterrupted background streaming when screen is off
        try {
            PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
            if (powerManager != null) {
                wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "RadioCristal::BackgroundAudioLock");
                wakeLock.acquire();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // 3. Configure WebView and force-clear stale cache on APK updates
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            WebSettings settings = webView.getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);

            try {
                PackageInfo pInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
                long currentVersionCode = android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P 
                    ? pInfo.getLongVersionCode() 
                    : pInfo.versionCode;

                SharedPreferences prefs = getSharedPreferences("RadioCristalPrefs", MODE_PRIVATE);
                long lastVersionCode = prefs.getLong("last_version_code", -1);

                // If this is a newly installed APK version, purge WebView disk/memory cache immediately
                // so the user never needs to install twice or suffer stale cached assets!
                if (lastVersionCode != currentVersionCode) {
                    webView.clearCache(true);
                    prefs.edit().putLong("last_version_code", currentVersionCode).apply();
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

            // 4. Register In-App Updater for direct in-app APK download & installation without browser
            try {
                webView.addJavascriptInterface(new InAppUpdater(this, webView), "AndroidAppUpdater");
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        // Keep JavaScript audio loop alive when app goes to background or screen turns off
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().resumeTimers();
        }
    }

    @Override
    public void onStop() {
        super.onStop();
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().resumeTimers();
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
    }
}
