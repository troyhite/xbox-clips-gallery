export interface XboxClip {
  gameClipId: string;
  state: string;
  dateRecorded: string;
  lastModified: string;
  userCaption: string;
  type: string;
  durationInSeconds: number;
  scid: string;
  titleId: number;
  rating: number;
  ratingCount: number;
  views: number;
  titleData: string;
  thumbnails: Array<{
    uri: string;
    fileSize: number;
    thumbnailType: string;
  }>;
  gameClipUris: Array<{
    uri: string;
    fileSize: number;
    uriType: string;
    expiration: string;
  }>;
  xuid: string;
  clipName: string;
  titleName: string;
  gameClipLocale: string;
}

export interface XboxScreenshot {
  screenshotId: string;
  resolutionHeight: number;
  resolutionWidth: number;
  state: string;
  datePublished: string;
  dateTaken: string;
  lastModified: string;
  userCaption: string;
  type: string;
  scid: string;
  titleId: number;
  rating: number;
  ratingCount: number;
  views: number;
  titleData: string;
  thumbnails: Array<{
    uri: string;
    fileSize: number;
    thumbnailType: string;
  }>;
  screenshotUris: Array<{
    uri: string;
    fileSize: number;
    uriType: string;
    expiration: string;
  }>;
  xuid: string;
  screenshotName: string;
  titleName: string;
  screenshotLocale: string;
}

export interface XboxProfile {
  xuid: string;
  gamertag: string;
  displayPicRaw: string;
  realName?: string;
}

/**
 * Get Xbox user token from Microsoft access token
 */
export async function getXboxToken(accessToken: string): Promise<string> {
  const response = await fetch('/api/xbox/authenticate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accessToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to authenticate with Xbox Live');
  }

  const data = await response.json();
  return data.xboxToken;
}

/**
 * Get user's Xbox profile
 */
export async function getXboxProfile(xboxToken: string): Promise<XboxProfile> {
  const response = await fetch('/api/xbox/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${xboxToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Xbox profile');
  }

  return response.json();
}

/**
 * Get user's Xbox clips
 */
export async function getXboxClips(authHeader: string, xuid: string): Promise<XboxClip[]> {
  const response = await fetch(`/api/xbox/clips?xuid=${xuid}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authHeader}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Xbox clips');
  }

  const data = await response.json();
  return data.gameClips || [];
}

/**
 * Get user's Xbox screenshots
 */
export async function getXboxScreenshots(authHeader: string, xuid: string): Promise<XboxScreenshot[]> {
  const response = await fetch(`/api/xbox/screenshots?xuid=${xuid}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authHeader}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Xbox screenshots');
  }

  const data = await response.json();
  return data.screenshots || [];
}

/**
 * Download a media file
 */
export async function downloadMedia(url: string, filename: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
