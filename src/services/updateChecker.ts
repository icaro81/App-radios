import { APP_VERSION, APP_BUILD_CODE, DEFAULT_REPO } from '../version';

export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
  releaseTitle?: string;
  releaseNotes?: string;
  downloadUrl?: string;
  publishedAt?: string;
  repoNotFound?: boolean;
}

// Compare semantic versions (e.g. '1.0.5' vs '1.0.4' or 'v1.0.12' vs 'v1.0.4')
export function isVersionGreater(remote: string, local: string): boolean {
  const cleanRemote = remote.replace(/^v/i, '').trim();
  const cleanLocal = local.replace(/^v/i, '').trim();

  const remoteParts = cleanRemote.split('.').map((p) => parseInt(p, 10) || 0);
  const localParts = cleanLocal.split('.').map((p) => parseInt(p, 10) || 0);

  const maxLen = Math.max(remoteParts.length, localParts.length);
  for (let i = 0; i < maxLen; i++) {
    const r = remoteParts[i] ?? 0;
    const l = localParts[i] ?? 0;
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}

export async function checkAppUpdate(customRepo?: string): Promise<UpdateInfo | null> {
  let repo = customRepo || localStorage.getItem('radio_cristal_github_repo') || DEFAULT_REPO;
  if (repo === 'icarojose81/RadioCristal') {
    repo = DEFAULT_REPO;
    localStorage.setItem('radio_cristal_github_repo', DEFAULT_REPO);
  }

  let repoNotFound = false;

  try {
    // 1. Try checking GitHub Releases API
    const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (response.ok) {
      const release = await response.json();
      const tagName: string = release.tag_name || '';
      const hasNewer = isVersionGreater(tagName, APP_VERSION);

      // Locate app-debug.apk asset if present
      let downloadUrl = release.html_url;
      if (Array.isArray(release.assets)) {
        const apkAsset = release.assets.find(
          (a: { name: string; browser_download_url: string }) =>
            a.name.endsWith('.apk')
        );
        if (apkAsset) {
          downloadUrl = apkAsset.browser_download_url;
        }
      }

      return {
        hasUpdate: hasNewer,
        latestVersion: tagName || APP_VERSION,
        currentVersion: APP_VERSION,
        releaseTitle: release.name || `Versión ${tagName}`,
        releaseNotes: release.body || 'Nuevas mejoras de estabilidad y funciones añadidas.',
        downloadUrl,
        publishedAt: release.published_at,
        repoNotFound: false,
      };
    } else if (response.status === 404) {
      repoNotFound = true;
    }
  } catch (err) {
    console.warn('GitHub update check network error:', err);
  }

  // 2. Fallback check from version.json
  try {
    const localResp = await fetch('/version.json?t=' + Date.now());
    if (localResp.ok) {
      const data = await localResp.json();
      const hasNewer = isVersionGreater(data.versionName, APP_VERSION);
      return {
        hasUpdate: hasNewer,
        latestVersion: data.versionName,
        currentVersion: APP_VERSION,
        releaseTitle: data.title,
        releaseNotes: data.notes,
        downloadUrl: data.downloadUrl || undefined,
        repoNotFound,
      };
    }
  } catch {
    // ignore
  }

  return {
    hasUpdate: false,
    latestVersion: APP_VERSION,
    currentVersion: APP_VERSION,
    repoNotFound,
  };
}
