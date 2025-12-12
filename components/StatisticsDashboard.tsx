'use client';

import { XboxClip, XboxScreenshot } from '@/lib/xboxApi';

interface StatisticsDashboardProps {
  clips: XboxClip[];
  screenshots: XboxScreenshot[];
}

export default function StatisticsDashboard({ clips, screenshots }: StatisticsDashboardProps) {
  // Calculate statistics
  const totalMedia = clips.length + screenshots.length;
  const totalViews = [...clips, ...screenshots].reduce((sum, media) => sum + (media.views || 0), 0);

  // Get most captured games
  const gameStats = new Map<string, { count: number; clips: number; screenshots: number }>();
  
  clips.forEach(clip => {
    const game = clip.titleName || 'Unknown Game';
    const stats = gameStats.get(game) || { count: 0, clips: 0, screenshots: 0 };
    stats.count++;
    stats.clips++;
    gameStats.set(game, stats);
  });

  screenshots.forEach(screenshot => {
    const game = screenshot.titleName || 'Unknown Game';
    const stats = gameStats.get(game) || { count: 0, clips: 0, screenshots: 0 };
    stats.count++;
    stats.screenshots++;
    gameStats.set(game, stats);
  });

  const topGames = Array.from(gameStats.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  // Calculate total video duration
  const totalDuration = clips.reduce((sum, clip) => sum + clip.durationInSeconds, 0);
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Get media by month for timeline
  const mediaByMonth = new Map<string, number>();
  [...clips, ...screenshots].forEach(media => {
    const date = new Date('dateRecorded' in media ? media.dateRecorded : media.dateTaken);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    mediaByMonth.set(monthKey, (mediaByMonth.get(monthKey) || 0) + 1);
  });

  const recentMonths = Array.from(mediaByMonth.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 6)
    .reverse();

  const maxMonthCount = Math.max(...recentMonths.map(m => m[1]), 1);
  const minMonthCount = recentMonths.length > 0 ? Math.min(...recentMonths.map(m => m[1])) : 0;
  // Always use enhanced scaling for better visual differences
  const range = maxMonthCount - minMonthCount;

  // Get most recent capture
  const allMedia = [...clips, ...screenshots];
  const mostRecent = allMedia.sort((a, b) => {
    const dateA = new Date('dateRecorded' in a ? a.dateRecorded : a.dateTaken);
    const dateB = new Date('dateRecorded' in b ? b.dateRecorded : b.dateTaken);
    return dateB.getTime() - dateA.getTime();
  })[0];

  const mostRecentDate = mostRecent 
    ? new Date('dateRecorded' in mostRecent ? mostRecent.dateRecorded : mostRecent.dateTaken)
    : null;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Your Xbox Gallery Statistics
      </h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-400 text-sm">Screenshots</span>
          </div>
          <p className="text-3xl font-bold text-white">{screenshots.length}</p>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-400 text-sm">Clips</span>
          </div>
          <p className="text-3xl font-bold text-white">{clips.length}</p>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-400 text-sm">Total Duration</span>
          </div>
          <p className="text-3xl font-bold text-white">{formatDuration(totalDuration)}</p>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-gray-400 text-sm">Total Views</span>
          </div>
          <p className="text-3xl font-bold text-white">{totalViews.toLocaleString()}</p>
        </div>
      </div>

      {/* Top Games */}
      {topGames.length > 0 && (
        <div className="mb-8">
          <h3 className="text-base font-semibold text-white mb-4">Most Captured Games</h3>
          <div className="space-y-3">
            {topGames.map(([game, stats], index) => (
              <div key={game} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-600">#{index + 1}</span>
                    <span className="text-white font-medium">{game}</span>
                  </div>
                  <span className="text-blue-400 font-bold">{stats.count}</span>
                </div>
                <div className="flex gap-4 text-sm text-gray-400">
                  <span>{stats.clips} clips</span>
                  <span>{stats.screenshots} screenshots</span>
                </div>
                <div className="mt-2 bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(stats.count / totalMedia) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {recentMonths.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-white mb-4">
            Activity (Last 6 Months)
            <span className="text-xs text-green-400 ml-2">● Enhanced View</span>
          </h3>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex items-end justify-between gap-2 h-48">
              {recentMonths.map(([month, count]) => {
                const [year, monthNum] = month.split('-');
                const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { month: 'short' });
                // Enhanced scaling: map values from min-max to 40%-100% for better visibility
                const height = range > 0
                  ? ((count - minMonthCount) / range) * 60 + 40
                  : 100;
                
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-2 h-full">
                    <div className="w-full flex items-end justify-center h-48">
                      <div className="flex flex-col items-center w-full">
                        <span className="text-xs text-gray-400 mb-1">{count}</span>
                        <div 
                          className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all duration-300"
                          style={{ height: `${height * 0.48}px` }}
                          title={`${count} captures`}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      <div>{monthName}</div>
                      <div className="text-[10px]">{year}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {mostRecentDate && (
        <div className="mt-6 bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">
              Last capture: <span className="text-white font-medium">{mostRecentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              {mostRecent && <span className="text-gray-500"> - {mostRecent.titleName}</span>}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
