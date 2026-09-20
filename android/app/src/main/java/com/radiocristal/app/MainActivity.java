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

                SharedPreferences prefs = getSharedPreferences("GalenaDigitalPrefs", MODE_PRIVATE);
                long lastVersionCode = prefs.getLong("last_version_code", -1);

                // If this is a newly installed APK version, purge WebView disk/memory cache immediately
                // so the user never needs to install twice or suffer stale cached assets!
                if (lastVersionCode != currentVersionCode) {
                    webView.clearCache(true);
                    try {
                        android.webkit.WebStorage.getInstance().deleteAllData();
                    } catch (Exception ignored) {}
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

    private long lastBackPressTime = 0;

    @Override
    public boolean dispatchKeyEvent(android.view.KeyEvent event) {
        if (event.getKeyCode() == android.view.KeyEvent.KEYCODE_BACK) {
            if (event.getAction() == android.view.KeyEvent.ACTION_UP) {
                handleBackButton();
            }
            return true; // Always consume KEYCODE_BACK so Capacitor does not prematurely close the app
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    public void onBackPressed() {
        handleBackButton();
    }

    private void handleBackButton() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            webView.evaluateJavascript(
                "(function() { if (window.__onNativeBackPress) { return window.__onNativeBackPress(); } return false; })()",
                value -> {
                    // "true" means a modal window was open and is now closed (1 back press = close window)
                    if (!"true".equals(value)) {
                        // "false" means no modal was open -> require 2 presses to exit app
                        runOnUiThread(() -> {
                            long now = System.currentTimeMillis();
                            if (now - lastBackPressTime < 2000) {
                                finish();
                            } else {
                                lastBackPressTime = now;
                                android.widget.Toast.makeText(
                                    MainActivity.this,
                                    "Presiona atrás de nuevo para salir",
                                    android.widget.Toast.LENGTH_SHORT
                                ).show();
                                webView.evaluateJavascript(
                                    "if (window.__showExitToast) window.__showExitToast();",
                                    null
                                );
                            }
                        });
                    }
                }
            );
        } else {
            long now = System.currentTimeMillis();
            if (now - lastBackPressTime < 2000) {
                finish();
            } else {
                lastBackPressTime = now;
                android.widget.Toast.makeText(
                    MainActivity.this,
                    "Presiona atrás de nuevo para salir",
                    android.widget.Toast.LENGTH_SHORT
                ).show();
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
