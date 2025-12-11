'use client';

import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { useState, useEffect } from 'react';
import AuthButton from '@/components/AuthButton';
import ScreenshotGrid from '@/components/ScreenshotGrid';
import ClipsGrid from '@/components/ClipsGrid';
import { getXboxToken, getXboxProfile, getXboxClips, getXboxScreenshots, XboxClip, XboxScreenshot, XboxProfile } from '@/lib/xboxApi';
import { loginRequest } from '@/lib/msalConfig';

export default function Home() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [activeTab, setActiveTab] = useState<'screenshots' | 'clips'>('screenshots');
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

      const { xboxToken, userHash, xuid, gamertag } = await xboxAuthResponse.json();
      const authHeader = JSON.stringify({ token: xboxToken, userHash });

      // Get profile
      const profileResponse = await fetch('/api/xbox/profile', {
        headers: { 'Authorization': `Bearer ${authHeader}` },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
      }

      // Get screenshots and clips
      const [screenshotsData, clipsData] = await Promise.all([
        getXboxScreenshots(authHeader, xuid),
        getXboxClips(authHeader, xuid),
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
            <div>
              <h1 className="text-3xl font-bold text-white">Xbox Media Gallery</h1>
              {profile && (
                <p className="text-gray-400 mt-1">Welcome, {profile.gamertag}!</p>
              )}
            </div>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!isAuthenticated ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Sign in to view your Xbox clips and screenshots
            </h2>
            <p className="text-gray-400 mb-8">
              Connect your Microsoft account to access your Xbox media library
            </p>
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
          <>
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
            </div>

            {activeTab === 'screenshots' ? (
              <ScreenshotGrid screenshots={screenshots} />
            ) : (
              <ClipsGrid clips={clips} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
