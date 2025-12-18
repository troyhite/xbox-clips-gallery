'use client';

import { XboxAchievement } from '@/lib/xboxApi';
import { useState } from 'react';

interface AchievementsGridProps {
  achievements: XboxAchievement[];
}

export default function AchievementsGrid({ achievements }: AchievementsGridProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<XboxAchievement | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getRarityColor = (percentage: number) => {
    if (percentage >= 50) return 'text-gray-400';
    if (percentage >= 20) return 'text-blue-400';
    if (percentage >= 5) return 'text-purple-400';
    if (percentage >= 1) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getRarityLabel = (percentage: number) => {
    if (percentage >= 50) return 'Common';
    if (percentage >= 20) return 'Uncommon';
    if (percentage >= 5) return 'Rare';
    if (percentage >= 1) return 'Epic';
    return 'Legendary';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-900 to-orange-900 rounded-lg p-6 border border-yellow-500 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">🏆 Recent Achievements</h2>
            <p className="text-yellow-200">
              {achievements.length} achievement{achievements.length !== 1 ? 's' : ''} unlocked
            </p>
          </div>
          <div className="text-6xl">🎖️</div>
        </div>
      </div>

      {achievements.length === 0 ? (
        <div className="text-center py-16 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-gray-400 text-lg">No achievements unlocked yet</p>
          <p className="text-gray-500 mt-2">Keep playing to unlock achievements!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {achievements.map((achievement) => {
            const iconAsset = achievement.mediaAssets?.find(asset => asset.type === 'Icon');
            const gamerscore = achievement.rewards?.find(r => r.type === 'Gamerscore')?.value || '0';
            const gameName = achievement.titleAssociations?.[0]?.name || 'Unknown Game';
            const rarityPercent = achievement.rarity?.currentPercentage || 0;

            return (
              <div
                key={achievement.id}
                onClick={() => setSelectedAchievement(achievement)}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 overflow-hidden hover:border-yellow-500 transition-all cursor-pointer transform hover:scale-105 shadow-lg"
              >
                {/* Achievement Icon */}
                <div className="relative aspect-square bg-gray-900">
                  {iconAsset?.url ? (
                    <img
                      src={iconAsset.url}
                      alt={achievement.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      🏆
                    </div>
                  )}
                  {/* Gamerscore Badge */}
                  <div className="absolute top-2 right-2 bg-yellow-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                    <span>⭐</span>
                    {gamerscore}
                  </div>
                </div>

                {/* Achievement Info */}
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-white text-sm line-clamp-2">{achievement.name}</h3>
                  <p className="text-xs text-gray-400 line-clamp-2">{achievement.description}</p>
                  
                  {/* Game Name */}
                  <p className="text-xs text-blue-400 truncate">🎮 {gameName}</p>
                  
                  {/* Unlock Date and Rarity */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-700">
                    <span className="text-gray-500">
                      {formatDate(achievement.progression?.timeUnlocked)}
                    </span>
                    <span className={`font-semibold ${getRarityColor(rarityPercent)}`}>
                      {getRarityLabel(rarityPercent)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAchievement(null)}
        >
          <div
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl max-w-2xl w-full border border-yellow-500 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {/* Achievement Image */}
              <div className="relative h-64 bg-gray-900">
                {selectedAchievement.mediaAssets?.find(a => a.type === 'Icon')?.url ? (
                  <img
                    src={selectedAchievement.mediaAssets.find(a => a.type === 'Icon')!.url}
                    alt={selectedAchievement.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-9xl">
                    🏆
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedAchievement(null)}
                className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedAchievement.name}</h2>
                <p className="text-gray-300">{selectedAchievement.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                <div>
                  <p className="text-gray-400 text-sm">Game</p>
                  <p className="text-white font-semibold">
                    {selectedAchievement.titleAssociations?.[0]?.name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Gamerscore</p>
                  <p className="text-yellow-400 font-bold text-lg">
                    ⭐ {selectedAchievement.rewards?.find(r => r.type === 'Gamerscore')?.value || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Unlocked</p>
                  <p className="text-white font-semibold">
                    {formatDate(selectedAchievement.progression?.timeUnlocked)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Rarity</p>
                  <p className={`font-bold ${getRarityColor(selectedAchievement.rarity?.currentPercentage || 0)}`}>
                    {getRarityLabel(selectedAchievement.rarity?.currentPercentage || 0)}
                    <span className="text-gray-400 text-sm ml-1">
                      ({selectedAchievement.rarity?.currentPercentage?.toFixed(1) || '0'}%)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
