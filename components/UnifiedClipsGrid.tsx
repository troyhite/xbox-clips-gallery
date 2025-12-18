'use client';

import { useState, useEffect } from 'react';
import { XboxClip } from '@/lib/xboxApi';
import { TwitchClip } from '@/lib/twitchApi';

interface UnifiedClip {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  duration: number;
  views: number;
  createdAt: string;
  platform: 'xbox' | 'twitch';
  gameName?: string;
}

interface UnifiedClipsGridProps {
  xboxClips: XboxClip[];
  xuid: string;
}

export default function UnifiedClipsGrid({ xboxClips, xuid }: UnifiedClipsGridProps) {
  const [allClips, setAllClips] = useState<UnifiedClip[]>([]);
  const [filter, setFilter] = useState<'all' | 'xbox' | 'twitch'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'views'>('date');
  const [isLoadingTwitch, setIsLoadingTwitch] = useState(false);

  useEffect(() => {
    loadAllClips();
  }, [xboxClips]);

  const loadAllClips = async () => {
    // Convert Xbox clips to unified format
    const unifiedXboxClips: UnifiedClip[] = xboxClips.map(clip => ({
      id: clip.gameClipId,
      title: clip.clipName || 'Xbox Game Clip',
      thumbnail: clip.thumbnails?.[0]?.uri || '',
      url: clip.gameClipUris?.[0]?.uri || '',
      duration: clip.durationInSeconds || 0,
      views: 0, // Xbox doesn't provide view count
      createdAt: clip.dateRecorded,
      platform: 'xbox' as const,
      gameName: clip.titleName,
    }));

    setAllClips(unifiedXboxClips);

    // Load Twitch clips if connected
    const twitchToken = localStorage.getItem('twitch_access_token');
    if (twitchToken) {
      await loadTwitchClips(twitchToken, unifiedXboxClips);
    }
  };

  const loadTwitchClips = async (token: string, existingClips: UnifiedClip[]) => {
    setIsLoadingTwitch(true);
    try {
      // First get the Twitch user ID
      const profileResponse = await fetch('/api/twitch/profile', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!profileResponse.ok) {
        console.error('Failed to load Twitch profile');
        return;
      }

      const profile = await profileResponse.json();

      // Now get clips
      const clipsResponse = await fetch(`/api/twitch/clips?user_id=${profile.id}&first=50`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (clipsResponse.ok) {
        const { clips } = await clipsResponse.json();
        
        const unifiedTwitchClips: UnifiedClip[] = clips.map((clip: TwitchClip) => ({
          id: clip.id,
          title: clip.title,
          thumbnail: clip.thumbnail_url,
          url: clip.url,
          duration: clip.duration,
          views: clip.view_count,
          createdAt: clip.created_at,
          platform: 'twitch' as const,
          gameName: clip.broadcaster_name,
        }));

        setAllClips([...existingClips, ...unifiedTwitchClips]);
      }
    } catch (error) {
      console.error('Error loading Twitch clips:', error);
    } finally {
      setIsLoadingTwitch(false);
    }
  };

  const getFilteredAndSortedClips = () => {
    let filtered = allClips;

    // Apply platform filter
    if (filter !== 'all') {
      filtered = filtered.filter(clip => clip.platform === filter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return b.views - a.views;
      }
    });

    return filtered;
  };

  const filteredClips = getFilteredAndSortedClips();
  const xboxCount = allClips.filter(c => c.platform === 'xbox').length;
  const twitchCount = allClips.filter(c => c.platform === 'twitch').length;

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

  return (
    <div className="space-y-4">
      {/* Filter and Sort Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm font-semibold">Filter:</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All ({allClips.length})
          </button>
          <button
            onClick={() => setFilter('xbox')}
            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 ${
              filter === 'xbox'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <span className="text-lg">🎮</span> Xbox ({xboxCount})
          </button>
          <button
            onClick={() => setFilter('twitch')}
            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 ${
              filter === 'twitch'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
            </svg>
            Twitch ({twitchCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm font-semibold">Sort by:</span>
          <button
            onClick={() => setSortBy('date')}
            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
              sortBy === 'date'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Date
          </button>
          <button
            onClick={() => setSortBy('views')}
            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
              sortBy === 'views'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Views
          </button>
        </div>
      </div>

      {isLoadingTwitch && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          <p className="text-gray-400 mt-2">Loading Twitch clips...</p>
        </div>
      )}

      {/* Clips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClips.map((clip) => (
          <div
            key={`${clip.platform}-${clip.id}`}
            className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all group cursor-pointer"
            onClick={() => window.open(clip.url, '_blank')}
          >
            {/* Thumbnail */}
            <div className="relative aspect-video">
              <img
                src={clip.thumbnail}
                alt={clip.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              
              {/* Platform Badge */}
              <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold ${
                clip.platform === 'xbox'
                  ? 'bg-green-600 text-white'
                  : 'bg-purple-600 text-white'
              }`}>
                {clip.platform === 'xbox' ? '🎮 Xbox' : (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                    </svg>
                    Twitch
                  </span>
                )}
              </div>

              {/* Duration */}
              <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-bold text-white">
                {formatDuration(clip.duration)}
              </div>
            </div>

            {/* Clip Info */}
            <div className="p-3">
              <h3 className="text-white font-semibold text-sm line-clamp-2 mb-2">
                {clip.title}
              </h3>
              
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{clip.gameName || 'Unknown Game'}</span>
                <span>{formatDate(clip.createdAt)}</span>
              </div>

              {clip.platform === 'twitch' && (
                <div className="mt-2 text-xs text-purple-400">
                  👁️ {clip.views.toLocaleString()} views
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredClips.length === 0 && !isLoadingTwitch && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No clips found</p>
          <p className="text-gray-500 text-sm mt-2">
            {filter !== 'all' && `Try changing the filter to see more clips`}
          </p>
        </div>
      )}
    </div>
  );
}
