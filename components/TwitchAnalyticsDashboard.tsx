'use client';

import { useState, useEffect } from 'react';
import { XboxProfile, XboxClip, XboxAchievement } from '@/lib/xboxApi';
import { TwitchUser, TwitchClip } from '@/lib/twitchApi';

interface AnalyticsData {
  xbox: {
    gamerscore: number;
    achievements: number;
    clips: number;
    recentActivity: string;
  };
  twitch: {
    followers: number;
    viewCount: number;
    clips: number;
    topClipViews: number;
  };
}

interface TwitchAnalyticsDashboardProps {
  xboxProfile: XboxProfile | null;
  xboxClips: XboxClip[];
  achievements: XboxAchievement[];
}

export default function TwitchAnalyticsDashboard({ 
  xboxProfile, 
  xboxClips,
  achievements 
}: TwitchAnalyticsDashboardProps) {
  const [twitchUser, setTwitchUser] = useState<TwitchUser | null>(null);
  const [twitchClips, setTwitchClips] = useState<TwitchClip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    loadTwitchData();
  }, []);

  const loadTwitchData = async () => {
    const twitchToken = localStorage.getItem('twitch_access_token');
    if (!twitchToken) {
      setIsLoading(false);
      return;
    }

    setIsConnected(true);

    try {
      // Load Twitch profile
      const profileResponse = await fetch('/api/twitch/profile', {
        headers: { 'Authorization': `Bearer ${twitchToken}` },
      });

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        setTwitchUser(profile);

        // Load Twitch clips
        const clipsResponse = await fetch(`/api/twitch/clips?user_id=${profile.id}&first=50`, {
          headers: { 'Authorization': `Bearer ${twitchToken}` },
        });

        if (clipsResponse.ok) {
          const { clips } = await clipsResponse.json();
          setTwitchClips(clips);
        }
      }
    } catch (error) {
      console.error('Error loading Twitch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-gradient-to-br from-purple-900 to-gray-900 rounded-xl p-8 text-center border border-purple-500">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold text-white mb-2">Analytics Dashboard</h2>
        <p className="text-gray-300 mb-6">
          Connect your Twitch account to view cross-platform analytics
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
        >
          Refresh Page After Connecting
        </button>
      </div>
    );
  }

  const xboxData = {
    gamerscore: xboxProfile?.gamerscore || 0,
    achievements: achievements.length,
    clips: xboxClips.length,
    recentActivity: xboxClips[0]?.dateRecorded || 'N/A',
  };

  const twitchData = {
    followers: twitchUser?.view_count || 0,
    viewCount: twitchUser?.view_count || 0,
    clips: twitchClips.length,
    topClipViews: twitchClips.length > 0 
      ? Math.max(...twitchClips.map(c => c.view_count))
      : 0,
  };

  const totalClips = xboxData.clips + twitchData.clips;
  const avgTwitchViews = twitchClips.length > 0
    ? Math.round(twitchClips.reduce((sum, c) => sum + c.view_count, 0) / twitchClips.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900 via-purple-900 to-pink-900 rounded-xl p-6 border border-purple-500">
        <h2 className="text-3xl font-bold text-white mb-2">📊 Cross-Platform Analytics</h2>
        <p className="text-gray-300">
          Compare your Xbox and Twitch performance at a glance
        </p>
      </div>

      {/* Platform Overview Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Xbox Stats */}
        <div className="bg-gradient-to-br from-green-900 to-blue-900 rounded-xl p-6 border border-green-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-3xl">🎮</span> Xbox
            </h3>
            <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
              GAMING
            </span>
          </div>

          <div className="space-y-4">
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Gamerscore</p>
              <p className="text-3xl font-bold text-yellow-400">
                {xboxData.gamerscore.toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Achievements</p>
                <p className="text-2xl font-bold text-white">{xboxData.achievements}</p>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Clips</p>
                <p className="text-2xl font-bold text-white">{xboxData.clips}</p>
              </div>
            </div>

            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Profile</p>
              <p className="text-lg font-semibold text-green-400">
                {xboxProfile?.gamertag || 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        {/* Twitch Stats */}
        <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-xl p-6 border border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
              </svg>
              Twitch
            </h3>
            <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
              STREAMING
            </span>
          </div>

          <div className="space-y-4">
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Channel Views</p>
              <p className="text-3xl font-bold text-purple-400">
                {twitchData.viewCount.toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Clips</p>
                <p className="text-2xl font-bold text-white">{twitchData.clips}</p>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Top Clip Views</p>
                <p className="text-2xl font-bold text-white">
                  {twitchData.topClipViews.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Channel</p>
              <p className="text-lg font-semibold text-purple-400">
                {twitchUser?.display_name || 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Combined Stats */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-6 border border-blue-500">
        <h3 className="text-2xl font-bold text-white mb-4">📈 Combined Metrics</h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-black/30 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-2">Total Clips</p>
            <p className="text-3xl font-bold text-white">{totalClips}</p>
            <p className="text-xs text-gray-500 mt-1">
              Xbox: {xboxData.clips} | Twitch: {twitchData.clips}
            </p>
          </div>

          <div className="bg-black/30 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-2">Avg Twitch Clip Views</p>
            <p className="text-3xl font-bold text-white">{avgTwitchViews.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">
              From {twitchData.clips} clips
            </p>
          </div>

          <div className="bg-black/30 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-2">Content Distribution</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-purple-500"
                    style={{ width: totalClips > 0 ? `${(xboxData.clips / totalClips) * 100}%` : '50%' }}
                  ></div>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {totalClips > 0 ? Math.round((xboxData.clips / totalClips) * 100) : 50}% Xbox | {totalClips > 0 ? Math.round((twitchData.clips / totalClips) * 100) : 50}% Twitch
            </p>
          </div>
        </div>
      </div>

      {/* Top Performing Twitch Clips */}
      {twitchClips.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-2xl font-bold text-white mb-4">🏆 Top Twitch Clips</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {twitchClips
              .sort((a, b) => b.view_count - a.view_count)
              .slice(0, 3)
              .map((clip, index) => (
                <div
                  key={clip.id}
                  className="bg-gray-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all cursor-pointer"
                  onClick={() => window.open(clip.url, '_blank')}
                >
                  <img src={clip.thumbnail_url} alt={clip.title} className="w-full aspect-video object-cover" />
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-yellow-400 font-bold">#{index + 1}</span>
                      <span className="text-purple-400 text-sm">👁️ {clip.view_count.toLocaleString()}</span>
                    </div>
                    <p className="text-white text-sm font-semibold line-clamp-2">{clip.title}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
