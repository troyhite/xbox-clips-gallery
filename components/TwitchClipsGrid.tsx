'use client';

import { useState, useEffect } from 'react';
import { TwitchClip } from '@/lib/twitchApi';

export default function TwitchClipsGrid() {
  const [clips, setClips] = useState<TwitchClip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'views'>('date');

  useEffect(() => {
    loadTwitchClips();
  }, []);

  const loadTwitchClips = async () => {
    const twitchToken = localStorage.getItem('twitch_access_token');
    if (!twitchToken) {
      setIsLoading(false);
      return;
    }

    setIsConnected(true);

    try {
      // Get Twitch user ID first
      const profileResponse = await fetch('/api/twitch/profile', {
        headers: { 'Authorization': `Bearer ${twitchToken}` },
      });

      if (!profileResponse.ok) {
        console.error('Failed to load Twitch profile');
        setIsLoading(false);
        return;
      }

      const profile = await profileResponse.json();

      // Get clips
      const clipsResponse = await fetch(`/api/twitch/clips?user_id=${profile.id}&first=50`, {
        headers: { 'Authorization': `Bearer ${twitchToken}` },
      });

      if (clipsResponse.ok) {
        const { clips } = await clipsResponse.json();
        setClips(clips);
      }
    } catch (error) {
      console.error('Error loading Twitch clips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSortedClips = () => {
    return [...clips].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return b.view_count - a.view_count;
      }
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-gray-400">Loading Twitch clips...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-gradient-to-br from-purple-900 to-gray-900 rounded-xl p-12 text-center border border-purple-500">
        <svg className="w-24 h-24 mx-auto mb-6 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
        </svg>
        <h2 className="text-3xl font-bold text-white mb-4">Connect Twitch to View Clips</h2>
        <p className="text-gray-300 mb-6 max-w-md mx-auto">
          Link your Twitch account to view and manage your Twitch clips alongside your Xbox content
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
        >
          Connect Twitch Account
        </button>
      </div>
    );
  }

  const sortedClips = getSortedClips();

  return (
    <div className="space-y-4">
      {/* Header with Sort */}
      <div className="flex items-center justify-between bg-gradient-to-r from-purple-900 to-pink-900 p-4 rounded-lg border border-purple-500">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
            </svg>
            Twitch Clips
          </h2>
          <p className="text-purple-300 text-sm mt-1">{clips.length} clips found</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm font-semibold">Sort by:</span>
          <button
            onClick={() => setSortBy('date')}
            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
              sortBy === 'date'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Date
          </button>
          <button
            onClick={() => setSortBy('views')}
            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
              sortBy === 'views'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Views
          </button>
        </div>
      </div>

      {/* Clips Grid */}
      {sortedClips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedClips.map((clip) => (
            <div
              key={clip.id}
              className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all group cursor-pointer"
              onClick={() => window.open(clip.url, '_blank')}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video">
                <img
                  src={clip.thumbnail_url}
                  alt={clip.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                
                {/* Duration */}
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-bold text-white">
                  {formatDuration(clip.duration)}
                </div>

                {/* View Count Badge */}
                <div className="absolute top-2 right-2 bg-purple-600/90 px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1">
                  👁️ {clip.view_count.toLocaleString()}
                </div>
              </div>

              {/* Clip Info */}
              <div className="p-4">
                <h3 className="text-white font-semibold text-sm line-clamp-2 mb-3">
                  {clip.title}
                </h3>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="text-purple-400">🎮</span>
                      {clip.broadcaster_name}
                    </span>
                    <span>{formatDate(clip.created_at)}</span>
                  </div>

                  {clip.creator_name && clip.creator_name !== clip.broadcaster_name && (
                    <div className="text-xs text-purple-400">
                      Clipped by {clip.creator_name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <div className="text-6xl mb-4">🎬</div>
          <p className="text-gray-400 text-lg">No Twitch clips found</p>
          <p className="text-gray-500 text-sm mt-2">
            Start streaming and create some epic moments!
          </p>
        </div>
      )}
    </div>
  );
}
