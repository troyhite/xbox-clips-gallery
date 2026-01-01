'use client';

import { useState, useEffect } from 'react';
import { BattlefieldStats } from '@/lib/trackerApi';

interface Battlefield6StatsProps {
  gamertag: string;
}

export default function Battlefield6Stats({ gamertag }: Battlefield6StatsProps) {
  const [stats, setStats] = useState<BattlefieldStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platform] = useState<'xbl'>('xbl'); // Default to Xbox Live since this is an Xbox app

  useEffect(() => {
    loadStats();
  }, [gamertag]);

  const loadStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/battlefield6/stats?platform=${platform}&playerName=${encodeURIComponent(gamertag)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Battlefield 6 stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <p className="text-gray-400 text-sm">
            {error.includes('not found') 
              ? 'This player either hasn\'t played Battlefield 6 or their stats are private.'
              : 'Please try again later.'}
          </p>
        </div>
      </div>
    );
  }

  if (!stats || !stats.segments || stats.segments.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <p className="text-gray-400 text-center">No Battlefield 6 stats available</p>
      </div>
    );
  }

  // Get the overview segment (general stats)
  const overviewSegment = stats.segments.find(s => s.type === 'overview');
  if (!overviewSegment) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <p className="text-gray-400 text-center">No overview stats available</p>
      </div>
    );
  }

  const { stats: playerStats } = overviewSegment;

  // Define key stats to display
  const keyStats = [
    { key: 'kills', label: 'Kills', icon: '🎯' },
    { key: 'deaths', label: 'Deaths', icon: '💀' },
    { key: 'kd', label: 'K/D Ratio', icon: '📊' },
    { key: 'wins', label: 'Wins', icon: '🏆' },
    { key: 'losses', label: 'Losses', icon: '❌' },
    { key: 'winPercentage', label: 'Win %', icon: '✨' },
    { key: 'scorePerMinute', label: 'Score/Min', icon: '⚡' },
    { key: 'killsPerMatch', label: 'Kills/Match', icon: '🎮' },
    { key: 'deathsPerMatch', label: 'Deaths/Match', icon: '☠️' },
    { key: 'timePlayed', label: 'Time Played', icon: '⏱️' },
    { key: 'matchesPlayed', label: 'Matches', icon: '🎲' },
    { key: 'revives', label: 'Revives', icon: '🚑' },
  ];

  return (
    <div className="space-y-6">
      {/* Player Header */}
      <div className="bg-gradient-to-r from-green-900 to-gray-800 rounded-lg p-6">
        <div className="flex items-center space-x-4">
          {stats.platformInfo.avatarUrl && (
            <img
              src={stats.platformInfo.avatarUrl}
              alt="Profile"
              className="w-20 h-20 rounded-full border-2 border-green-500"
            />
          )}
          <div>
            <h2 className="text-2xl font-bold text-white">
              {stats.platformInfo.platformUserHandle}
            </h2>
            <p className="text-gray-300">Battlefield 6 Stats</p>
            {stats.userInfo.pageviews > 0 && (
              <p className="text-sm text-gray-400">{stats.userInfo.pageviews.toLocaleString()} profile views</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {keyStats.map(({ key, label, icon }) => {
          const stat = playerStats[key];
          if (!stat) return null;

          return (
            <div
              key={key}
              className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{icon}</span>
                {stat.rank && (
                  <span className="text-xs text-green-400">
                    #{stat.rank.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {stat.displayValue}
              </div>
              <div className="text-sm text-gray-400">{label}</div>
              {stat.percentile !== null && stat.percentile !== undefined && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Top {(100 - stat.percentile).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{ width: `${stat.percentile}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Weapon/Vehicle Stats if available */}
      {stats.segments.filter(s => s.type === 'weapon' || s.type === 'vehicle').length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Additional Stats</h3>
          <p className="text-gray-400 text-sm">
            {stats.segments.filter(s => s.type === 'weapon').length} weapons tracked, {' '}
            {stats.segments.filter(s => s.type === 'vehicle').length} vehicles tracked
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        <p>Stats provided by <a href="https://tracker.gg/battlefield-6" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-400">Tracker Network</a></p>
        <p className="mt-1">Last updated: {new Date(stats.expiryDate).toLocaleString()}</p>
      </div>
    </div>
  );
}
