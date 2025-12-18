'use client';

import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { useState, useEffect } from 'react';
import AuthButton from '@/components/AuthButton';
import TwitchAuthButton from '@/components/TwitchAuthButton';
import ScreenshotGrid from '@/components/ScreenshotGrid';
import ClipsGrid from '@/components/ClipsGrid';
import CompilationsGrid from '@/components/CompilationsGrid';
import AchievementsGrid from '@/components/AchievementsGrid';
import RecentGamesCarousel from '@/components/RecentGamesCarousel';
import StatisticsDashboard from '@/components/StatisticsDashboard';
import { getXboxToken, getXboxProfile, getXboxClips, getXboxScreenshots, getXboxAchievements, getXboxTitleHistory, XboxClip, XboxScreenshot, XboxProfile, XboxAchievement, XboxTitle } from '@/lib/xboxApi';
import { loginRequest } from '@/lib/msalConfig';
import TwitchClipsGrid from '@/components/TwitchClipsGrid';
import TwitchAnalyticsDashboard from '@/components/TwitchAnalyticsDashboard';
import LiveStreamMonitor from '@/components/LiveStreamMonitor';

export default function Home() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'screenshots' | 'clips' | 'twitch-clips' | 'compilations' | 'achievements' | 'analytics' | 'live-stream'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<XboxProfile | null>(null);
  const [screenshots, setScreenshots] = useState<XboxScreenshot[]>([]);
  const [clips, setClips] = useState<XboxClip[]>([]);
  const [achievements, setAchievements] = useState<XboxAchievement[]>([]);
  const [recentTitles, setRecentTitles] = useState<XboxTitle[]>([]);
  const [compilationsCount, setCompilationsCount] = useState(0);
  const [twitchConnected, setTwitchConnected] = useState(false);
  const [twitchClipsCount, setTwitchClipsCount] = useState(0);
  const [twitchUsername, setTwitchUsername] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated && accounts.length > 0) {
      loadXboxData();
    } else {
      // Clear data when signed out
      setProfile(null);
      setScreenshots([]);
      setClips([]);
      setAchievements([]);
      setRecentTitles([]);
      setError(null);
    }
    // Check Twitch connection on mount
    loadTwitchData();
  }, [isAuthenticated, accounts]);

  const loadTwitchData = async () => {
    const twitchToken = localStorage.getItem('twitch_access_token');
    if (!twitchToken) {
      setTwitchConnected(false);
      return;
    }

    try {
      // Get Twitch profile
      const profileResponse = await fetch('/api/twitch/profile', {
        headers: { 'Authorization': `Bearer ${twitchToken}` },
      });

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        setTwitchConnected(true);
        setTwitchUsername(profile.display_name || profile.login);

        // Get Twitch clips count
        const clipsResponse = await fetch(`/api/twitch/clips?user_id=${profile.id}&first=100`, {
          headers: { 'Authorization': `Bearer ${twitchToken}` },
        });

        if (clipsResponse.ok) {
          const { clips } = await clipsResponse.json();
          setTwitchClipsCount(clips.length);
        }
      } else {
        setTwitchConnected(false);
      }
    } catch (error) {
      console.error('Error loading Twitch data:', error);
      setTwitchConnected(false);
    }
  };

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
      
      // Try to get achievements and recent titles (optional - don't fail if they don't work)
      try {
        const achievementsData = await getXboxAchievements(authHeaderValue, userXuid);
        setAchievements(achievementsData);
      } catch (achievementsError) {
        console.warn('Could not load achievements:', achievementsError);
        setAchievements([]); // Empty array so tab still shows
      }

      try {
        const titlesData = await getXboxTitleHistory(authHeaderValue, userXuid);
        console.log('Title history loaded:', { count: titlesData.length, titles: titlesData.slice(0, 3) });
        setRecentTitles(titlesData);
      } catch (titlesError) {
        console.error('Could not load title history:', titlesError);
        setRecentTitles([]);
      }

      // Fetch compilations count
      try {
        const compilationsRes = await fetch('/api/xbox/compilations');
        if (compilationsRes.ok) {
          const compilationsData = await compilationsRes.json();
          setCompilationsCount(compilationsData.compilations?.length || 0);
        }
      } catch (compilationsError) {
        console.warn('Could not load compilations count:', compilationsError);
        setCompilationsCount(0);
      }
    } catch (err) {
      console.error('Error loading Xbox data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load Xbox data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-2xl border-b-4 border-green-500 overflow-hidden">
        {/* Animated background pattern - Enhanced */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/2 right-1/4 w-80 h-80 bg-blue-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Xbox logo pattern overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-2 right-12 text-[180px] font-black text-green-400 transform rotate-12 select-none" style={{ textShadow: '0 0 60px rgba(34, 197, 94, 0.5)' }}>X</div>
          <div className="absolute bottom-0 left-8 text-[140px] select-none filter drop-shadow-[0_0_40px_rgba(59,130,246,0.6)]">🎮</div>
        </div>
        
        <div className="container mx-auto px-4 py-6 relative z-10">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Title */}
            <div className="flex items-center gap-6">
              <div className="bg-gradient-to-br from-green-600 to-blue-600 p-4 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
                <svg className="w-10 h-10 text-white" viewBox="0 0 23 23" fill="currentColor">
                  <path d="M0 0h11v11H0zm12 0h11v11H12zM0 12h11v11H0zm12 0h11v11H12z"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                    Xbox Media Gallery
                  </h1>
                  <span className="px-3 py-1 bg-green-600 text-white text-sm font-extrabold rounded-full shadow-lg">
                    LIVE
                  </span>
                </div>
              </div>
            </div>
            
            {/* Right: Gamertag and Auth Buttons */}
            <div className="flex items-center gap-4">
              {profile && (
                <p className="text-gray-300 text-base font-semibold">
                  <span className="text-green-400">@</span>{profile.gamertag}
                </p>
              )}
              <TwitchAuthButton />
              <AuthButton />
            </div>
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
          <div>
            {activeTab === 'dashboard' ? (
              /* Dashboard Landing Page */
              <div className="space-y-6">
                {/* Welcome Hero Section with Quick Actions */}
                <div className="bg-gradient-to-r from-green-900 via-blue-900 to-purple-900 rounded-xl p-6 border border-green-500 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {profile?.displayPicRaw && (
                        <img 
                          src={profile.displayPicRaw} 
                          alt={`${profile.gamertag}'s profile`}
                          className="w-20 h-20 rounded-full border-4 border-green-400 shadow-xl"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://avatar-ssl.xboxlive.com/avatar/${profile.xuid}/avatar-body.png`;
                          }}
                        />
                      )}
                      <h1 className="text-3xl font-bold text-white">
                        Welcome back, {profile?.gamertag}! 🎮
                      </h1>
                    </div>
                    {profile?.gamerscore !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300">Gamerscore:</span>
                        <span className="text-4xl font-bold text-yellow-400">
                          {profile.gamerscore.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setActiveTab('twitch-clips')}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      🎬 View Twitch Clips
                    </button>
                    <button
                      onClick={() => setActiveTab('screenshots')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      📸 Browse Screenshots
                    </button>
                    <button
                      onClick={() => setActiveTab('compilations')}
                      className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      🤖 Create AI Compilation
                    </button>
                    <button
                      onClick={() => setActiveTab('achievements')}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      🏆 View Achievements
                    </button>
                  </div>
                </div>

                {/* Two-Column Layout: Game Stats (Left) + Feature Cards (Right) */}
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Game Stats Dashboard - Vertical Sidebar */}
                  {recentTitles && recentTitles.length > 0 && (
                    <div className="lg:w-96 flex-shrink-0">
                      <div className="bg-gradient-to-br from-green-900 to-teal-900 rounded-xl p-5 border border-green-500 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="text-4xl">📊</div>
                          <div>
                            <h2 className="text-xl font-bold text-white">Game Stats</h2>
                            <p className="text-green-200 text-xs">Your progress across games</p>
                          </div>
                        </div>
                        
                        {/* Vertical Stats List */}
                        <div className="space-y-4">
                          {recentTitles.slice(0, 6).map((title) => {
                            const currentAch = title.achievement?.currentAchievements || 0;
                            const currentScore = title.achievement?.currentGamerscore || 0;
                            const totalScore = title.achievement?.totalGamerscore || 0;
                            const completionPct = title.achievement?.progressPercentage || 0;
                            const totalAch = completionPct > 0 && currentAch > 0 
                              ? Math.round(currentAch / (completionPct / 100))
                              : (title.achievement?.totalAchievements || 0);
                            
                            return (
                              <div key={title.titleId} className="bg-gray-800 bg-opacity-60 rounded-lg p-3 border border-green-700">
                                <div className="flex items-center gap-3 mb-3">
                                  {title.displayImage && (
                                    <img
                                      src={title.displayImage}
                                      alt={title.name}
                                      className="w-12 h-16 object-cover rounded border border-gray-600 flex-shrink-0"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white text-sm truncate mb-1">{title.name}</h3>
                                    <div className="text-xs text-green-400 font-semibold">{completionPct}% Complete</div>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  {/* Achievement Progress Bar */}
                                  <div>
                                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                                      <span>Achievements</span>
                                      <span className="font-semibold text-yellow-400">{currentAch}/{totalAch}</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                      <div
                                        className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all"
                                        style={{ width: `${completionPct}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  
                                  {/* Gamerscore */}
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-300">Gamerscore</span>
                                    <span className="font-bold text-yellow-400">
                                      ⭐ {currentScore}<span className="text-gray-400">/{totalScore}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Feature Cards Grid */}
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Recent Activity Card */}
                  <div className="md:col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-600 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-4xl">⚡</div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Recent Activity</h3>
                        <p className="text-gray-300 text-sm">Your latest captures</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Recent Screenshots */}
                      {screenshots.slice(0, 2).map((screenshot) => (
                        <div
                          key={screenshot.screenshotId}
                          onClick={() => setActiveTab('screenshots')}
                          className="group cursor-pointer"
                        >
                          <div className="relative rounded-lg overflow-hidden border-2 border-gray-700 hover:border-blue-500 transition-all">
                            <img
                              src={screenshot.thumbnails?.[0]?.uri || screenshot.screenshotUris?.[0]?.uri}
                              alt="Screenshot"
                              className="w-full aspect-video object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
                              📸
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs text-gray-400 truncate">{screenshot.titleName}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(screenshot.dateTaken).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Recent Clips */}
                      {clips.slice(0, 2).map((clip) => (
                        <div
                          key={clip.gameClipId}
                          onClick={() => setActiveTab('clips')}
                          className="group cursor-pointer"
                        >
                          <div className="relative rounded-lg overflow-hidden border-2 border-gray-700 hover:border-purple-500 transition-all">
                            <img
                              src={clip.thumbnails?.[0]?.uri}
                              alt="Clip thumbnail"
                              className="w-full aspect-video object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold">
                              🎬
                            </div>
                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                              {Math.floor(clip.durationInSeconds / 60)}:{String(clip.durationInSeconds % 60).padStart(2, '0')}
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs text-gray-400 truncate">{clip.titleName}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(clip.dateRecorded).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {screenshots.length === 0 && clips.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <p>No recent activity. Start capturing your gaming moments!</p>
                      </div>
                    )}
                  </div>

                  {/* Screenshots Card */}
                  <div
                    onClick={() => setActiveTab('screenshots')}
                    className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 border border-blue-500 hover:border-blue-400 transition-all cursor-pointer transform hover:scale-105 shadow-xl group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-6xl">📸</div>
                      <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {screenshots.length}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                      Screenshots
                    </h3>
                    <p className="text-blue-200">
                      View, download, and manage your captured gaming moments
                    </p>
                  </div>

                  {/* Clips Card */}
                  <div
                    onClick={() => setActiveTab('clips')}
                    className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-xl p-6 border border-purple-500 hover:border-purple-400 transition-all cursor-pointer transform hover:scale-105 shadow-xl group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-6xl">🎬</div>
                      <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {clips.length}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                      Game Clips
                    </h3>
                    <p className="text-purple-200">
                      Stream your gameplay videos and create highlight compilations
                    </p>
                  </div>

                  {/* AI Compilations Card */}
                  <div
                    onClick={() => setActiveTab('compilations')}
                    className="bg-gradient-to-br from-pink-900 to-purple-900 rounded-xl p-6 border border-pink-500 hover:border-pink-400 transition-all cursor-pointer transform hover:scale-105 shadow-xl group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 bg-yellow-500 text-black px-3 py-1 text-xs font-bold rounded-bl-lg">
                      AI POWERED
                    </div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-6xl">🤖</div>
                      <div className="bg-pink-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {compilationsCount}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-pink-300 transition-colors">
                      Compilations
                    </h3>
                    <p className="text-pink-200">
                      AI-generated highlight reels from your best gaming moments
                    </p>
                  </div>

                  {/* Achievements Card */}
                  <div
                    onClick={() => setActiveTab('achievements')}
                    className="bg-gradient-to-br from-yellow-900 to-orange-900 rounded-xl p-6 border border-yellow-500 hover:border-yellow-400 transition-all cursor-pointer transform hover:scale-105 shadow-xl group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-6xl">🏆</div>
                      <div className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {achievements.length}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-yellow-300 transition-colors">
                      Achievements
                    </h3>
                    <p className="text-yellow-200">
                      Recent unlocks with rarity ratings and gamerscore
                    </p>
                  </div>

                  {/* Twitch Card */}
                  <div
                    onClick={() => setActiveTab(twitchConnected ? 'live-stream' : 'twitch-clips')}
                    className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 border border-purple-400 hover:border-purple-300 transition-all cursor-pointer transform hover:scale-105 shadow-xl group relative"
                  >
                    {twitchConnected && (
                      <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg flex items-center gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        CONNECTED
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-6xl">
                        <svg className="w-16 h-16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                        </svg>
                      </div>
                      {twitchConnected && (
                        <div className="bg-purple-700 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {twitchClipsCount}
                        </div>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors">
                      {twitchConnected ? `Twitch` : 'Connect Twitch'}
                    </h3>
                    <p className="text-purple-100">
                      {twitchConnected 
                        ? `@${twitchUsername} • Monitor streams & create clips`
                        : 'Link your Twitch account to monitor streams and clips'
                      }
                    </p>
                  </div>

                    </div>
                  </div>
                </div>
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
                  {/* Back to Dashboard Button */}
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Dashboard
                  </button>

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
                  Xbox Clips ({clips.length})
                </button>
                <button
                  onClick={() => setActiveTab('twitch-clips')}
                  className={`px-6 py-3 font-semibold transition flex items-center gap-2 ${
                    activeTab === 'twitch-clips'
                      ? 'text-purple-500 border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                  </svg>
                  Twitch Clips
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
                <button
                  onClick={() => setActiveTab('achievements')}
                  className={`px-6 py-3 font-semibold transition ${
                    activeTab === 'achievements'
                      ? 'text-blue-500 border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Achievements ({achievements.length}) 🏆
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-6 py-3 font-semibold transition ${
                    activeTab === 'analytics'
                      ? 'text-blue-500 border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Analytics 📊
                </button>
                <button
                  onClick={() => setActiveTab('live-stream')}
                  className={`px-6 py-3 font-semibold transition ${
                    activeTab === 'live-stream'
                      ? 'text-red-500 border-b-2 border-red-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🔴 Live Stream
                </button>
              </div>

              {activeTab === 'screenshots' ? (
                <ScreenshotGrid screenshots={screenshots} />
              ) : activeTab === 'clips' ? (
                <ClipsGrid clips={clips} />
              ) : activeTab === 'twitch-clips' ? (
                <TwitchClipsGrid />
              ) : activeTab === 'compilations' ? (
                <CompilationsGrid />
              ) : activeTab === 'analytics' ? (
                <TwitchAnalyticsDashboard 
                  xboxProfile={profile}
                  xboxClips={clips}
                  achievements={achievements}
                />
              ) : activeTab === 'live-stream' ? (
                <LiveStreamMonitor />
              ) : (
                <AchievementsGrid achievements={achievements} />
              )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
