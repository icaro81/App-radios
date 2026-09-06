package com.radiocristal.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.support.v4.media.MediaBrowserCompat;
import android.support.v4.media.MediaDescriptionCompat;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.media.MediaBrowserServiceCompat;
import androidx.media.app.NotificationCompat.MediaStyle;

import java.util.ArrayList;
import java.util.List;

/**
 * Standard Android Auto & background MediaBrowserService for Radio Cristal HD.
 * Integrates directly with car head units, steering wheel controls, and Android Auto dashboard launcher.
 */
public class RadioMediaBrowserService extends MediaBrowserServiceCompat {
    private static final String CHANNEL_ID = "radio_cristal_channel";
    private static final int NOTIFICATION_ID = 899;
    private static final String MEDIA_ROOT_ID = "root_stations";

    private MediaSessionCompat mediaSession;
    private MediaPlayer mediaPlayer;
    private PlaybackStateCompat.Builder stateBuilder;

    private static class StationItem {
        final String id;
        final String title;
        final String subtitle;
        final String streamUrl;

        StationItem(String id, String title, String subtitle, String streamUrl) {
            this.id = id;
            this.title = title;
            this.subtitle = subtitle;
            this.streamUrl = streamUrl;
        }
    }

    private final List<StationItem> stations = new ArrayList<>();
    private int currentStationIndex = 0;

    @Override
    public void onCreate() {
        super.onCreate();

        stations.add(new StationItem(
            "la-bruja-fm",
            "La Bruja FM 89.9",
            "89.9 MHz FM • Emisión en directo",
            "https://rr5100.globalhost1.com/8452/stream"
        ));
        stations.add(new StationItem(
            "danielsan-radio",
            "DanielSanRadio",
            "Streaming Digital HD",
            "https://s2.servicioderadio.com:7023/stream"
        ));

        createNotificationChannel();

        // Initialize MediaSessionCompat
        mediaSession = new MediaSessionCompat(this, "RadioCristalService");
        setSessionToken(mediaSession.getSessionToken());

        mediaSession.setFlags(
            MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS |
            MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS
        );

        Intent intent = new Intent(this, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );
        mediaSession.setSessionActivity(pi);

        stateBuilder = new PlaybackStateCompat.Builder()
            .setActions(
                PlaybackStateCompat.ACTION_PLAY |
                PlaybackStateCompat.ACTION_PAUSE |
                PlaybackStateCompat.ACTION_PLAY_PAUSE |
                PlaybackStateCompat.ACTION_SKIP_TO_NEXT |
                PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS |
                PlaybackStateCompat.ACTION_STOP
            )
            .setState(PlaybackStateCompat.STATE_NONE, 0, 1.0f);

        mediaSession.setPlaybackState(stateBuilder.build());
        mediaSession.setCallback(sessionCallback);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Radio Cristal Reproducción",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Controles de audio y emisión para Android Auto y móvil");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Nullable
    @Override
    public BrowserRoot onGetRoot(@NonNull String clientPackageName, int clientUid, @Nullable Bundle rootHints) {
        return new BrowserRoot(MEDIA_ROOT_ID, null);
    }

    @Override
    public void onLoadChildren(@NonNull String parentId, @NonNull Result<List<MediaBrowserCompat.MediaItem>> result) {
        List<MediaBrowserCompat.MediaItem> items = new ArrayList<>();

        for (StationItem s : stations) {
            MediaDescriptionCompat desc = new MediaDescriptionCompat.Builder()
                .setMediaId(s.id)
                .setTitle(s.title)
                .setSubtitle(s.subtitle)
                .setDescription("Radio Cristal HD")
                .build();
            items.add(new MediaBrowserCompat.MediaItem(desc, MediaBrowserCompat.MediaItem.FLAG_PLAYABLE));
        }

        result.sendResult(items);
    }

    private final MediaSessionCompat.Callback sessionCallback = new MediaSessionCompat.Callback() {
        @Override
        public void onPlay() {
            playStation(currentStationIndex);
        }

        @Override
        public void onPlayFromMediaId(String mediaId, Bundle extras) {
            for (int i = 0; i < stations.size(); i++) {
                if (stations.get(i).id.equals(mediaId)) {
                    playStation(i);
                    return;
                }
            }
            playStation(0);
        }

        @Override
        public void onPause() {
            stopPlayback();
        }

        @Override
        public void onStop() {
            stopPlayback();
            stopSelf();
        }

        @Override
        public void onSkipToNext() {
            if (stations.isEmpty()) return;
            int next = (currentStationIndex + 1) % stations.size();
            playStation(next);
        }

        @Override
        public void onSkipToPrevious() {
            if (stations.isEmpty()) return;
            int prev = (currentStationIndex - 1 + stations.size()) % stations.size();
            playStation(prev);
        }
    };

    private void playStation(int index) {
        if (index < 0 || index >= stations.size()) return;
        currentStationIndex = index;
        StationItem station = stations.get(index);

        updatePlaybackState(PlaybackStateCompat.STATE_BUFFERING);
        updateMetadata(station);
        showNotification(station, true);

        try {
            if (mediaPlayer != null) {
                mediaPlayer.release();
                mediaPlayer = null;
            }

            mediaPlayer = new MediaPlayer();
            mediaPlayer.setAudioAttributes(
                new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .build()
            );
            mediaPlayer.setDataSource(this, Uri.parse(station.streamUrl));
            mediaPlayer.setOnPreparedListener(mp -> {
                mp.start();
                updatePlaybackState(PlaybackStateCompat.STATE_PLAYING);
                showNotification(station, false);
            });
            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                updatePlaybackState(PlaybackStateCompat.STATE_ERROR);
                return false;
            });
            mediaPlayer.prepareAsync();
        } catch (Exception e) {
            e.printStackTrace();
            updatePlaybackState(PlaybackStateCompat.STATE_ERROR);
        }
    }

    private void stopPlayback() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }
        updatePlaybackState(PlaybackStateCompat.STATE_PAUSED);
        if (currentStationIndex >= 0 && currentStationIndex < stations.size()) {
            showNotification(stations.get(currentStationIndex), false);
        }
        stopForeground(false);
    }

    private void updatePlaybackState(int state) {
        stateBuilder.setState(state, 0, 1.0f);
        mediaSession.setPlaybackState(stateBuilder.build());
    }

    private void updateMetadata(StationItem station) {
        MediaMetadataCompat metadata = new MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_MEDIA_ID, station.id)
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, station.title)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, station.subtitle)
            .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, "Radio Cristal HD")
            .putString(MediaMetadataCompat.METADATA_KEY_DISPLAY_TITLE, station.title)
            .putString(MediaMetadataCompat.METADATA_KEY_DISPLAY_SUBTITLE, station.subtitle)
            .build();
        mediaSession.setMetadata(metadata);
    }

    private void showNotification(StationItem station, boolean isBuffering) {
        Intent openIntent = new Intent(this, MainActivity.class);
        PendingIntent contentPi = PendingIntent.getActivity(
            this,
            0,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(station.title)
            .setContentText(isBuffering ? "Conectando señal..." : station.subtitle)
            .setSubText("Radio Cristal HD")
            .setContentIntent(contentPi)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOnlyAlertOnce(true)
            .setStyle(
                new MediaStyle()
                    .setMediaSession(mediaSession.getSessionToken())
                    .setShowActionsInCompactView(0)
            );

        Notification notification = builder.build();
        startForeground(NOTIFICATION_ID, notification);
    }

    @Override
    public void onDestroy() {
        if (mediaPlayer != null) {
            try {
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }
        if (mediaSession != null) {
            mediaSession.release();
            mediaSession = null;
        }
        super.onDestroy();
    }
}
