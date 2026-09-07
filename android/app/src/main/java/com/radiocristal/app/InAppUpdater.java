package com.radiocristal.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.content.FileProvider;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class InAppUpdater {
    private final Activity activity;
    private final WebView webView;
    private boolean isDownloading = false;

    public InAppUpdater(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    @JavascriptInterface
    public boolean isNativeAvailable() {
        return true;
    }

    @JavascriptInterface
    public boolean isDownloading() {
        return isDownloading;
    }

    @JavascriptInterface
    public void startDownloadAndInstall(final String apkUrl) {
        if (isDownloading) {
            return;
        }

        // On Android 8.0+ (Oreo), verify permission to install unknown apps
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (!activity.getPackageManager().canRequestPackageInstalls()) {
                try {
                    Intent grantIntent = new Intent(
                        Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + activity.getPackageName())
                    );
                    activity.startActivity(grantIntent);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }

        isDownloading = true;

        new Thread(() -> {
            InputStream in = null;
            FileOutputStream out = null;
            HttpURLConnection conn = null;

            try {
                URL currentUrl = new URL(apkUrl);
                int redirectCount = 0;
                final int MAX_REDIRECTS = 10;

                // Handle redirects (GitHub releases redirect to Amazon S3 CDN)
                while (redirectCount < MAX_REDIRECTS) {
                    conn = (HttpURLConnection) currentUrl.openConnection();
                    conn.setInstanceFollowRedirects(false);
                    conn.setConnectTimeout(15000);
                    conn.setReadTimeout(30000);
                    conn.setRequestProperty("User-Agent", "Mozilla/5.0 RadioCristalHD-AppUpdater");

                    int status = conn.getResponseCode();
                    if (status == HttpURLConnection.HTTP_MOVED_TEMP ||
                        status == HttpURLConnection.HTTP_MOVED_PERM ||
                        status == HttpURLConnection.HTTP_SEE_OTHER ||
                        status == 307 || status == 308) {

                        String newUrl = conn.getHeaderField("Location");
                        conn.disconnect();
                        if (newUrl == null) {
                            throw new Exception("Error al resolver redirección de descarga.");
                        }
                        currentUrl = new URL(newUrl);
                        redirectCount++;
                    } else if (status == HttpURLConnection.HTTP_OK) {
                        break;
                    } else {
                        throw new Exception("El servidor devolvió el código HTTP: " + status);
                    }
                }

                long totalBytes = conn.getContentLength();
                in = conn.getInputStream();

                File cacheDir = activity.getExternalCacheDir();
                if (cacheDir == null) {
                    cacheDir = activity.getCacheDir();
                }
                File apkFile = new File(cacheDir, "RadioCristal_Update.apk");
                if (apkFile.exists()) {
                    apkFile.delete();
                }

                out = new FileOutputStream(apkFile);
                byte[] buffer = new byte[8192];
                long bytesRead = 0;
                int n;

                long lastReportTime = 0;

                while ((n = in.read(buffer)) != -1) {
                    out.write(buffer, 0, n);
                    bytesRead += n;

                    long now = System.currentTimeMillis();
                    if (now - lastReportTime > 150 || bytesRead == totalBytes) {
                        lastReportTime = now;
                        final int percent = totalBytes > 0 ? (int) ((bytesRead * 100) / totalBytes) : -1;
                        final long currentBytes = bytesRead;
                        final long total = totalBytes;

                        activity.runOnUiThread(() -> {
                            String js = String.format(
                                "if (window.__onInAppUpdateProgress) window.__onInAppUpdateProgress(%d, %d, %d);",
                                percent, currentBytes, total
                            );
                            webView.evaluateJavascript(js, null);
                        });
                    }
                }

                out.flush();
                out.close();
                out = null;

                isDownloading = false;

                // Notify completion to UI
                activity.runOnUiThread(() -> {
                    webView.evaluateJavascript("if (window.__onInAppUpdateSuccess) window.__onInAppUpdateSuccess();", null);
                });

                // Trigger package installation
                Uri apkUri = FileProvider.getUriForFile(
                    activity,
                    activity.getPackageName() + ".fileprovider",
                    apkFile
                );

                Intent installIntent = new Intent(Intent.ACTION_VIEW);
                installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(installIntent);

            } catch (final Exception e) {
                isDownloading = false;
                e.printStackTrace();
                activity.runOnUiThread(() -> {
                    String cleanErr = e.getMessage() != null ? e.getMessage().replace("'", "\\'") : "Error desconocido";
                    String js = String.format("if (window.__onInAppUpdateError) window.__onInAppUpdateError('%s');", cleanErr);
                    webView.evaluateJavascript(js, null);
                });
            } finally {
                try {
                    if (in != null) in.close();
                } catch (Exception ignored) {}
                try {
                    if (out != null) out.close();
                } catch (Exception ignored) {}
                try {
                    if (conn != null) conn.disconnect();
                } catch (Exception ignored) {}
            }
        }).start();
    }
}
