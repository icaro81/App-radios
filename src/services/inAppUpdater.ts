interface InAppUpdaterGlobal {
  isNativeAvailable?: () => boolean;
  isDownloading?: () => boolean;
  startDownloadAndInstall?: (apkUrl: string) => void;
}

declare global {
  interface Window {
    AndroidAppUpdater?: InAppUpdaterGlobal;
    __onInAppUpdateProgress?: (percent: number, bytesRead: number, totalBytes: number) => void;
    __onInAppUpdateSuccess?: () => void;
    __onInAppUpdateError?: (error: string) => void;
  }
}

export function isNativeUpdaterAvailable(): boolean {
  try {
    return Boolean(
      typeof window !== 'undefined' &&
      window.AndroidAppUpdater &&
      typeof window.AndroidAppUpdater.startDownloadAndInstall === 'function' &&
      window.AndroidAppUpdater.isNativeAvailable?.()
    );
  } catch {
    return false;
  }
}

export function startInAppUpdate({
  apkUrl,
  onProgress,
  onSuccess,
  onError,
}: {
  apkUrl: string;
  onProgress: (percent: number, bytesRead: number, totalBytes: number) => void;
  onSuccess: () => void;
  onError: (errorMessage: string) => void;
}): boolean {
  if (!isNativeUpdaterAvailable()) {
    onError('El instalador interno solo está disponible dentro de la app instalada en Android.');
    return false;
  }

  window.__onInAppUpdateProgress = (percent, bytesRead, totalBytes) => {
    onProgress(percent, bytesRead, totalBytes);
  };

  window.__onInAppUpdateSuccess = () => {
    onSuccess();
  };

  window.__onInAppUpdateError = (err) => {
    onError(err || 'Error al descargar la actualización.');
  };

  try {
    window.AndroidAppUpdater!.startDownloadAndInstall!(apkUrl);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    onError(msg);
    return false;
  }
}
