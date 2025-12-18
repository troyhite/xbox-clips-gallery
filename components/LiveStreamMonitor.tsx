'use client';

import { useState, useEffect } from 'react';

interface StreamInfo {
  id: string;
  userId: string;
  userName: string;
  gameId: string;
  gameName: string;
  title: string;
  viewerCount: number;
  startedAt: string;
  thumbnailUrl: string;
  tags: string[];
}

export default function LiveStreamMonitor() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingClip, setIsCreatingClip] = useState(false);
  const [lastClipCreated, setLastClipCreated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkStreamStatus();
    
    // Only poll if connected
    const twitchToken = localStorage.getItem('twitch_access_token');
    if (!twitchToken) {
      return;
    }
    
    // Poll stream status every 60 seconds
    const interval = setInterval(checkStreamStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const checkStreamStatus = async () => {
    const twitchToken = localStorage.getItem('twitch_access_token');
    if (!twitchToken) {
      setIsLoading(false);
      setIsConnected(false);
      return;
    }

    setIsConnected(true);

    try {
      const response = await fetch('/api/twitch/stream-status', {
        headers: { 'Authorization': `Bearer ${twitchToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.warn('Stream status check failed:', errorData.error);
        
        // Don't show error to user for failed checks - just mark as offline
        setIsLive(false);
        setStreamInfo(null);
        return;
      }

      const data = await response.json();
      setIsLive(data.isLive);
      setStreamInfo(data.stream);
      setError(null);
    } catch (err) {
      console.warn('Stream status check failed:', err instanceof Error ? err.message : 'Unknown error');
      // Silently fail and mark as offline - don't show error to user
      setIsLive(false);
      setStreamInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClip = async () => {
    const twitchToken = localStorage.getItem('twitch_access_token');
    if (!twitchToken || !isLive) return;

    setIsCreatingClip(true);
    setError(null);

    try {
      const response = await fetch('/api/twitch/create-clip', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${twitchToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create clip');
      }

      const data = await response.json();
      setLastClipCreated(new Date().toLocaleTimeString());
      
      // Refresh stream status after creating clip
      setTimeout(() => checkStreamStatus(), 2000);
    } catch (err: any) {
      console.error('Error creating clip:', err);
      setError(err.message || 'Failed to create clip');
    } finally {
      setIsCreatingClip(false);
    }
  };

  const formatUptime = (startedAt: string) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-gray-400">Checking stream status...</p>
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
        <h2 className="text-3xl font-bold text-white mb-4">Connect Twitch to Monitor Streams</h2>
        <p className="text-gray-300 mb-6 max-w-md mx-auto">
          Link your Twitch account to monitor your live streams and generate highlight clips automatically
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

  return (
    <div className="space-y-6">
      {/* Stream Status Header */}
      <div className={`rounded-xl p-6 border ${
        isLive 
          ? 'bg-gradient-to-r from-red-900 to-purple-900 border-red-500' 
          : 'bg-gradient-to-r from-gray-900 to-purple-900 border-gray-700'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              {isLive && (
                <>
                  <div className="absolute -inset-1">
                    <div className="w-full h-full bg-red-500 rounded-full opacity-75 animate-ping"></div>
                  </div>
                  <div className="relative w-4 h-4 bg-red-500 rounded-full"></div>
                </>
              )}
              {!isLive && (
                <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {isLive ? '🔴 LIVE' : 'Offline'}
              </h2>
              <p className="text-gray-300 text-sm">
                {isLive ? 'Stream is active' : 'Not currently streaming'}
              </p>
            </div>
          </div>
          <button
            onClick={checkStreamStatus}
            className="text-gray-400 hover:text-white transition-colors text-sm px-4 py-2 bg-gray-800 rounded-lg"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Live Stream Info */}
      {isLive && streamInfo && (
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          {/* Stream Thumbnail */}
          <div className="relative aspect-video bg-gray-900">
            <img
              src={streamInfo.thumbnailUrl.replace('{width}', '1280').replace('{height}', '720')}
              alt={streamInfo.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 bg-red-600 px-3 py-1 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-white font-bold text-sm">LIVE</span>
            </div>
            <div className="absolute bottom-4 left-4 bg-black/80 px-3 py-1 rounded-lg">
              <span className="text-white font-semibold text-sm">👁️ {streamInfo.viewerCount.toLocaleString()} viewers</span>
            </div>
          </div>

          {/* Stream Details */}
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">{streamInfo.title}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  🎮 {streamInfo.gameName}
                </span>
                <span className="flex items-center gap-2">
                  ⏱️ {formatUptime(streamInfo.startedAt)} uptime
                </span>
              </div>
            </div>

            {/* Tags */}
            {streamInfo.tags && streamInfo.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {streamInfo.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full text-xs font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Create Clip Button */}
            <div className="pt-4 border-t border-gray-700">
              <button
                onClick={handleCreateClip}
                disabled={isCreatingClip}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isCreatingClip ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                    Creating Clip...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Create Highlight Clip
                  </>
                )}
              </button>
              
              {lastClipCreated && (
                <p className="text-green-400 text-sm mt-2 text-center">
                  ✓ Clip created at {lastClipCreated}
                </p>
              )}
              
              {error && (
                <p className="text-red-400 text-sm mt-2 text-center">
                  {error}
                </p>
              )}

              <p className="text-gray-500 text-xs mt-2 text-center">
                Creates a clip from the last 30 seconds of your stream
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Offline Instructions */}
      {!isLive && (
        <div className="bg-gray-800 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">📡</div>
          <h3 className="text-xl font-bold text-white mb-2">Stream Monitor Ready</h3>
          <p className="text-gray-400 mb-6">
            Start streaming on Twitch and this page will automatically detect your live stream.
            You'll be able to create highlight clips while live!
          </p>
          <div className="bg-purple-900/30 border border-purple-600 rounded-lg p-4 max-w-2xl mx-auto">
            <h4 className="font-semibold text-purple-300 mb-2">How it works:</h4>
            <ul className="text-left text-sm text-gray-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">1.</span>
                <span>Go live on Twitch as usual</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">2.</span>
                <span>This page will detect your stream automatically (refreshes every 60 seconds)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">3.</span>
                <span>Click "Create Highlight Clip" button whenever something awesome happens</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">4.</span>
                <span>Your clips will appear in the Twitch Clips tab within a few minutes</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
