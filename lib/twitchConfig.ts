// Twitch OAuth Configuration
export const twitchConfig = {
  clientId: process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID || '',
  clientSecret: process.env.TWITCH_CLIENT_SECRET || '',
  redirectUri: process.env.NEXT_PUBLIC_TWITCH_REDIRECT_URI || 'http://localhost:3000/twitch/callback',
  scopes: [
    'user:read:email',           // Read user email
    'clips:edit',                // Upload clips
    'channel:manage:videos',     // Manage channel videos
    'channel:read:stream_key',   // Read stream information
    'analytics:read:extensions', // Read analytics
    'analytics:read:games',      // Read game analytics
  ],
};

export const getTwitchAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: twitchConfig.clientId,
    redirect_uri: twitchConfig.redirectUri,
    response_type: 'code',
    scope: twitchConfig.scopes.join(' '),
    state: generateState(),
  });
  
  return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
};

// Generate random state for CSRF protection
function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}
