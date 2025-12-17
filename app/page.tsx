'use client';

import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { useState, useEffect } from 'react';
import AuthButton from '@/components/AuthButton';
import ScreenshotGrid from '@/components/ScreenshotGrid';
import ClipsGrid from '@/components/ClipsGrid';
import CompilationsGrid from '@/components/CompilationsGrid';
import StatisticsDashboard from '@/components/StatisticsDashboard';
import { getXboxToken, getXboxProfile, getXboxClips, getXboxScreenshots, XboxClip, XboxScreenshot, XboxProfile } from '@/lib/xboxApi';
import { loginRequest } from '@/lib/msalConfig';

export default function Home() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [activeTab, setActiveTab] = useState<'screenshots' | 'clips' | 'compilations'>('screenshots');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<XboxProfile | null>(null);
  const [screenshots, setScreenshots] = useState<XboxScreenshot[]>([]);
  const [clips, setClips] = useState<XboxClip[]>([]);

  useEffect(() => {
    if (isAuthenticated && accounts.length > 0) {
      loadXboxData();
    }
  }, [isAuthenticated, accounts]);

  const loadXboxData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get Microsoft access token
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });

      // Authenticate with Xbox Live
      const xboxAuthResponse = await fetch('/api/xbox/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: response.accessToken }),
      });

      if (!xboxAuthResponse.ok) {
        throw new Error('Failed to authenticate with Xbox Live');
      }

      const { xboxToken, userHash, xuid: userXuid, gamertag } = await xboxAuthResponse.json();
      const authHeaderValue = JSON.stringify({ token: xboxToken, userHash });

      // Get profile
      const profileResponse = await fetch('/api/xbox/profile', {
        headers: { 'Authorization': `Bearer ${authHeaderValue}` },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
      }

      // Get screenshots and clips
      const [screenshotsData, clipsData] = await Promise.all([
        getXboxScreenshots(authHeaderValue, userXuid),
        getXboxClips(authHeaderValue, userXuid),
      ]);

      setScreenshots(screenshotsData);
      setClips(clipsData);
    } catch (err) {
      console.error('Error loading Xbox data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load Xbox data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">Xbox Media Gallery</h1>
                {profile && (
                  <div className="flex items-center gap-2 mt-1">
                    {profile.displayPicRaw && (
                      <img 
                        src={profile.displayPicRaw} 
                        alt={`${profile.gamertag}'s profile`}
                        className="w-8 h-8 rounded-full border-2 border-gray-600"
                        onError={(e) => {
                          // Fallback to default avatar if image fails to load
                          (e.target as HTMLImageElement).src = `https://avatar-ssl.xboxlive.com/avatar/${profile.xuid}/avatar-body.png`;
                        }}
                      />
                    )}
                    <p className="text-gray-400">Welcome, {profile.gamertag}!</p>
                  </div>
                )}
              </div>
            </div>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!isAuthenticated ? (
          <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
            {/* Animated Gaming Background */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-green-500 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-blue-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 right-1/3 w-36 h-36 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Login Card */}
            <div className="relative z-10 max-w-2xl w-full">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
                {/* Xbox Hero Section */}
                <div className="bg-gradient-to-r from-green-600 to-blue-600 p-8 text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 text-[200px] font-bold text-white transform -rotate-12">X</div>
                    <div className="absolute bottom-0 right-0 text-[200px] font-bold text-white transform rotate-12">🎮</div>
                  </div>
                  <div className="relative z-10">
                    <div className="inline-block mb-4">
                      <div className="text-7xl mb-2 animate-bounce">🎮</div>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">Xbox Media Gallery</h1>
                    <p className="text-green-100 text-lg">Your Ultimate Gaming Moments Hub</p>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-8 space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-3">
                      Unlock Your Gaming Legacy
                    </h2>
                    <p className="text-gray-400 text-lg">
                      Access your epic clips, screenshots, and create AI-powered highlight reels
                    </p>
                  </div>

                  {/* Features Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700 hover:border-green-500 transition-all transform hover:scale-105">
                      <div className="text-3xl mb-2">📸</div>
                      <h3 className="text-white font-semibold mb-1">Screenshots</h3>
                      <p className="text-gray-400 text-sm">View & download your captures</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700 hover:border-blue-500 transition-all transform hover:scale-105">
                      <div className="text-3xl mb-2">🎬</div>
                      <h3 className="text-white font-semibold mb-1">Game Clips</h3>
                      <p className="text-gray-400 text-sm">Stream & share your plays</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700 hover:border-purple-500 transition-all transform hover:scale-105">
                      <div className="text-3xl mb-2">🤖</div>
                      <h3 className="text-white font-semibold mb-1">AI Highlights</h3>
                      <p className="text-gray-400 text-sm">Auto-generate compilations</p>
                    </div>
                  </div>

                  {/* Sign In Button */}
                  <div className="text-center">
                    <AuthButton />
                    <p className="text-gray-500 text-sm mt-4">
                      🔒 Secure authentication via Microsoft
                    </p>
                  </div>

                  {/* Feature Highlights */}
                  <div className="mt-8 pt-6 border-t border-gray-700">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <span className="text-green-400">✓</span>
                        <span>Instant access to media</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <span className="text-green-400">✓</span>
                        <span>AI-powered analysis</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <span className="text-green-400">✓</span>
                        <span>One-click downloads</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <span className="text-green-400">✓</span>
                        <span>Highlight compilation</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Stats */}
              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-800 bg-opacity-50 backdrop-blur rounded-lg p-4 border border-gray-700">
                  <div className="text-2xl font-bold text-green-400">∞</div>
                  <div className="text-gray-400 text-sm">Unlimited Storage</div>
                </div>
                <div className="bg-gray-800 bg-opacity-50 backdrop-blur rounded-lg p-4 border border-gray-700">
                  <div className="text-2xl font-bold text-blue-400">⚡</div>
                  <div className="text-gray-400 text-sm">Lightning Fast</div>
                </div>
                <div className="bg-gray-800 bg-opacity-50 backdrop-blur rounded-lg p-4 border border-gray-700">
                  <div className="text-2xl font-bold text-purple-400">🔒</div>
                  <div className="text-gray-400 text-sm">100% Secure</div>
                </div>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-white mt-4">Loading your Xbox media...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
            <p className="font-bold">Error</p>
            <p>{error}</p>
            <button
              onClick={loadXboxData}
              className="mt-3 bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar - Statistics */}
            <div className="lg:w-96 flex-shrink-0">
              <div className="lg:sticky lg:top-8">
                <StatisticsDashboard clips={clips} screenshots={screenshots} />
              </div>
            </div>

            {/* Right Content - Tabs and Grid */}
            <div className="flex-1 min-w-0">
              <div className="flex space-x-4 mb-8 border-b border-gray-700">
                <button
                  onClick={() => setActiveTab('screenshots')}
                  className={`px-6 py-3 font-semibold transition ${
                    activeTab === 'screenshots'
                      ? 'text-blue-500 border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Screenshots ({screenshots.length})
                </button>
                <button
                  onClick={() => setActiveTab('clips')}
                  className={`px-6 py-3 font-semibold transition ${
                    activeTab === 'clips'
                      ? 'text-blue-500 border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Clips ({clips.length})
                </button>
                <button
                  onClick={() => setActiveTab('compilations')}
                  className={`px-6 py-3 font-semibold transition ${
                    activeTab === 'compilations'
                      ? 'text-blue-500 border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Compilations 🎬
                </button>
              </div>

              {activeTab === 'screenshots' ? (
                <ScreenshotGrid screenshots={screenshots} />
              ) : activeTab === 'clips' ? (
                <ClipsGrid clips={clips} />
              ) : (
                <CompilationsGrid />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
