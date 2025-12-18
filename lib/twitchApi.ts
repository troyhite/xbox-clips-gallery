// Twitch API Client
export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  email?: string;
  created_at: string;
}

export interface TwitchClip {
  id: string;
  url: string;
  embed_url: string;
  broadcaster_id: string;
  broadcaster_name: string;
  creator_id: string;
  creator_name: string;
  video_id: string;
  game_id: string;
  language: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: number;
  vod_offset: number | null;
}

export interface TwitchVideo {
  id: string;
  stream_id: string | null;
  user_id: string;
  user_login: string;
  user_name: string;
  title: string;
  description: string;
  created_at: string;
  published_at: string;
  url: string;
  thumbnail_url: string;
  viewable: string;
  view_count: number;
  language: string;
  type: string;
  duration: string;
  muted_segments: any[] | null;
}

export interface TwitchAnalytics {
  game_id: string;
  game_name: string;
  total_views: number;
  total_clips: number;
  total_videos: number;
}

const TWITCH_API_BASE = 'https://api.twitch.tv/helix';

export class TwitchApiClient {
  private accessToken: string;
  private clientId: string;

  constructor(accessToken: string, clientId: string) {
    this.accessToken = accessToken;
    this.clientId = clientId;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${TWITCH_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Client-Id': this.clientId,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twitch API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Get authenticated user information
  async getUser(): Promise<TwitchUser> {
    const response = await this.makeRequest<{ data: TwitchUser[] }>('/users');
    if (!response.data || response.data.length === 0) {
      throw new Error('User not found');
    }
    return response.data[0];
  }

  // Get user's clips
  async getUserClips(userId: string, first: number = 20): Promise<TwitchClip[]> {
    const response = await this.makeRequest<{ data: TwitchClip[] }>(
      `/clips?broadcaster_id=${userId}&first=${first}`
    );
    return response.data || [];
  }

  // Get user's videos (VODs, highlights, uploads)
  async getUserVideos(userId: string, first: number = 20, type?: 'archive' | 'highlight' | 'upload'): Promise<TwitchVideo[]> {
    let endpoint = `/videos?user_id=${userId}&first=${first}`;
    if (type) {
      endpoint += `&type=${type}`;
    }
    const response = await this.makeRequest<{ data: TwitchVideo[] }>(endpoint);
    return response.data || [];
  }

  // Create a clip from a stream
  async createClip(broadcasterId: string): Promise<{ id: string; edit_url: string }> {
    const response = await this.makeRequest<{ data: Array<{ id: string; edit_url: string }> }>(
      `/clips?broadcaster_id=${broadcasterId}`,
      { method: 'POST' }
    );
    if (!response.data || response.data.length === 0) {
      throw new Error('Failed to create clip');
    }
    return response.data[0];
  }

  // Upload video to Twitch (requires additional setup with Twitch Video Upload API)
  // Note: Twitch doesn't have a simple video upload API - videos need to be created via:
  // 1. Streaming (creates VODs)
  // 2. Creating highlights from VODs
  // 3. Using third-party tools
  // For this feature, we'll need to use a workaround or Twitch's official tools

  // Get channel information
  async getChannelInfo(broadcasterId: string): Promise<any> {
    const response = await this.makeRequest<{ data: any[] }>(
      `/channels?broadcaster_id=${broadcasterId}`
    );
    return response.data?.[0] || null;
  }

  // Get basic analytics (game stats)
  async getGameAnalytics(userId: string): Promise<TwitchAnalytics[]> {
    // This is a simplified version - real implementation would aggregate from multiple endpoints
    const clips = await this.getUserClips(userId, 100);
    const videos = await this.getUserVideos(userId, 100);

    const gameStats = new Map<string, { name: string; views: number; clips: number; videos: number }>();

    clips.forEach(clip => {
      const game = gameStats.get(clip.game_id) || { name: '', views: 0, clips: 0, videos: 0 };
      game.views += clip.view_count;
      game.clips += 1;
      gameStats.set(clip.game_id, game);
    });

    return Array.from(gameStats.entries()).map(([gameId, stats]) => ({
      game_id: gameId,
      game_name: stats.name,
      total_views: stats.views,
      total_clips: stats.clips,
      total_videos: stats.videos,
    }));
  }
}

// Exchange authorization code for access token
export async function exchangeTwitchCode(code: string, clientId: string, clientSecret: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  return response.json();
}

// Refresh access token
export async function refreshTwitchToken(refreshToken: string, clientId: string, clientSecret: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  return response.json();
}

// Validate access token
export async function validateTwitchToken(accessToken: string): Promise<boolean> {
  const response = await fetch('https://id.twitch.tv/oauth2/validate', {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  return response.ok;
}
