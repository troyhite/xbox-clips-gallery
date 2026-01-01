// Tracker Network API integration for game stats
// API Documentation: https://tracker.gg/developers/docs

const TRACKER_API_BASE = 'https://public-api.tracker.gg/v2';

export interface BattlefieldStats {
  platformInfo: {
    platformSlug: string;
    platformUserId: string | null;
    platformUserHandle: string;
    platformUserIdentifier: string;
    avatarUrl: string;
    additionalParameters: null;
  };
  userInfo: {
    userId: number | null;
    isPremium: boolean;
    isVerified: boolean;
    isInfluencer: boolean;
    isPartner: boolean;
    countryCode: string | null;
    customAvatarUrl: string | null;
    customHeroUrl: string | null;
    socialAccounts: any[];
    pageviews: number;
    isSuspicious: boolean | null;
  };
  metadata: {
    currentSeason: number | null;
  };
  segments: Array<{
    type: string;
    attributes: Record<string, any>;
    metadata: Record<string, any>;
    expiryDate: string;
    stats: Record<string, {
      rank: number | null;
      percentile: number;
      displayName: string;
      displayCategory: string;
      category: string;
      metadata: Record<string, any>;
      value: number;
      displayValue: string;
      displayType: string;
    }>;
  }>;
  availableSegments: Array<{
    type: string;
    attributes: Record<string, any>;
    metadata: Record<string, any>;
  }>;
  expiryDate: string;
}

export async function getBattlefield6Stats(
  platform: 'origin' | 'xbl' | 'psn',
  playerName: string
): Promise<BattlefieldStats> {
  const apiKey = process.env.TRACKER_NETWORK_API_KEY;
  
  if (!apiKey) {
    throw new Error('Tracker Network API key not configured');
  }

  // Try "battlefield" as the game identifier (BF6 might be under general "battlefield" endpoint)
  const url = `${TRACKER_API_BASE}/battlefield/standard/profile/${platform}/${encodeURIComponent(playerName)}`;
  console.log('Fetching Battlefield stats from:', url);
  console.log('API Key present:', !!apiKey);
  
  const response = await fetch(url, {
    headers: {
      'TRN-Api-Key': apiKey,
    },
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  console.log('Response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log('Error response:', errorText);
    
    if (response.status === 404) {
      throw new Error('Player not found');
    }
    if (response.status === 401) {
      throw new Error('Invalid API key or API key not configured');
    }
    throw new Error(`Failed to fetch Battlefield 6 stats: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

export function formatStatValue(value: number, displayType: string): string {
  switch (displayType) {
    case 'TimeSeconds':
      const hours = Math.floor(value / 3600);
      const minutes = Math.floor((value % 3600) / 60);
      return `${hours}h ${minutes}m`;
    case 'Percentage':
      return `${value.toFixed(1)}%`;
    case 'NumberPerMatch':
      return value.toFixed(2);
    default:
      return value.toLocaleString();
  }
}
