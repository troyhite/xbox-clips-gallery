'use client';

import { XboxTitle } from '@/lib/xboxApi';
import { useState } from 'react';

interface RecentGamesCarouselProps {
  titles: XboxTitle[];
}

export default function RecentGamesCarousel({ titles }: RecentGamesCarouselProps) {
  const [selectedTitle, setSelectedTitle] = useState<XboxTitle | null>(null);

  console.log('RecentGamesCarousel render:', { titleCount: titles.length });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (titles.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-4 border border-blue-500 shadow-xl mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">🎮 Recently Played</h2>
            <p className="text-blue-200 text-sm">{titles.length} game{titles.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-gray-800">
          {titles.map((title) => (
            <div
              key={title.titleId}
              onClick={() => setSelectedTitle(title)}
              className="flex-shrink-0 w-48 snap-start cursor-pointer group"
            >
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-all transform hover:scale-105 shadow-lg">
                {/* Game Box Art */}
                <div className="relative aspect-[3/4] bg-gray-900">
                  {title.displayImage ? (
                    <img
                      src={title.displayImage}
                      alt={title.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      🎮
                    </div>
                  )}
                  
                  {/* Achievement Badge */}
                  {title.achievement && title.achievement.totalAchievements > 0 && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 px-2 py-1 rounded text-xs text-yellow-400 font-bold">
                      {title.achievement.currentAchievements}/{title.achievement.totalAchievements}
                    </div>
                  )}
                </div>

                {/* Game Info */}
                <div className="p-3">
                  <h3 className="font-bold text-white text-sm line-clamp-2 mb-1 group-hover:text-blue-400 transition-colors">
                    {title.name}
                  </h3>
                  {title.titleHistory?.lastTimePlayed && (
                    <p className="text-xs text-gray-400">
                      {formatDate(title.titleHistory.lastTimePlayed)}
                    </p>
                  )}
                  {title.achievement && title.achievement.currentGamerscore > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs">
                      <span className="text-yellow-400">⭐</span>
                      <span className="text-white font-semibold">{title.achievement.currentGamerscore}</span>
                      <span className="text-gray-400">/ {title.achievement.totalGamerscore}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Game Detail Modal */}
      {selectedTitle && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTitle(null)}
        >
          <div
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl max-w-2xl w-full border border-blue-500 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {/* Game Banner */}
              <div className="relative h-64 bg-gray-900">
                {selectedTitle.displayImage ? (
                  <img
                    src={selectedTitle.displayImage}
                    alt={selectedTitle.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-9xl">
                    🎮
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedTitle(null)}
                className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedTitle.name}</h2>
                {selectedTitle.detail?.shortDescription && (
                  <p className="text-gray-300">{selectedTitle.detail.shortDescription}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                {selectedTitle.titleHistory?.lastTimePlayed && (
                  <div>
                    <p className="text-gray-400 text-sm">Last Played</p>
                    <p className="text-white font-semibold">
                      {formatDate(selectedTitle.titleHistory.lastTimePlayed)}
                    </p>
                  </div>
                )}
                {selectedTitle.achievement && (
                  <>
                    <div>
                      <p className="text-gray-400 text-sm">Achievements</p>
                      <p className="text-white font-semibold">
                        {selectedTitle.achievement.currentAchievements} / {selectedTitle.achievement.totalAchievements}
                        {selectedTitle.achievement.totalAchievements > 0 && (
                          <span className="text-blue-400 text-sm ml-2">
                            ({Math.round((selectedTitle.achievement.currentAchievements / selectedTitle.achievement.totalAchievements) * 100)}%)
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Gamerscore</p>
                      <p className="text-yellow-400 font-bold text-lg">
                        ⭐ {selectedTitle.achievement.currentGamerscore} / {selectedTitle.achievement.totalGamerscore}
                      </p>
                    </div>
                  </>
                )}
                {selectedTitle.platformCapabilities && selectedTitle.platformCapabilities.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-gray-400 text-sm mb-1">Platforms</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTitle.platformCapabilities.map((platform, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
