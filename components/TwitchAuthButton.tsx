'use client';

import { useState, useEffect } from 'react';
import { getTwitchAuthUrl } from '@/lib/twitchConfig';
import { TwitchUser } from '@/lib/twitchApi';

export default function TwitchAuthButton() {
  const [twitchUser, setTwitchUser] = useState<TwitchUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user has Twitch token in localStorage
    const twitchToken = localStorage.getItem('twitch_access_token');
    if (twitchToken) {
      loadTwitchProfile(twitchToken);
    }
  }, []);

  const loadTwitchProfile = async (token: string) => {
    try {
      const response = await fetch('/api/twitch/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const user = await response.json();
        setTwitchUser(user);
      } else {
        // Token might be expired, clear it
        localStorage.removeItem('twitch_access_token');
        localStorage.removeItem('twitch_refresh_token');
      }
    } catch (error) {
      console.error('Error loading Twitch profile:', error);
    }
  };

  const handleConnect = () => {
    window.location.href = getTwitchAuthUrl();
  };

  const handleDisconnect = () => {
    localStorage.removeItem('twitch_access_token');
    localStorage.removeItem('twitch_refresh_token');
    setTwitchUser(null);
  };

  if (isLoading) {
    return (
      <button disabled className="px-4 py-2 bg-purple-600 text-white rounded-lg opacity-50 cursor-not-allowed">
        Connecting...
      </button>
    );
  }

  if (twitchUser) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-purple-900 rounded-lg border border-purple-500">
          <img 
            src={twitchUser.profile_image_url} 
            alt={twitchUser.display_name}
            className="w-8 h-8 rounded-full"
          />
          <div>
            <p className="text-sm font-semibold text-white">{twitchUser.display_name}</p>
            <p className="text-xs text-purple-300">Twitch Connected</p>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
      </svg>
      Connect Twitch
    </button>
  );
}
