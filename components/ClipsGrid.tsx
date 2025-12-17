'use client';

import { XboxClip } from '@/lib/xboxApi';
import { downloadMedia } from '@/lib/xboxApi';
import Image from 'next/image';
import { useState } from 'react';
import MediaDetailsPanel from './MediaDetailsPanel';
import ShareButton from './ShareButton';
import HighlightsPanel from './HighlightsPanel';

interface ClipsGridProps {
  clips: XboxClip[];
}

export default function ClipsGrid({ clips }: ClipsGridProps) {
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [detailsClip, setDetailsClip] = useState<XboxClip | null>(null);
  const [analyzingClip, setAnalyzingClip] = useState<{ videoId: string; clipName: string; videoUrl: string } | null>(null);
  const [analyzingClipId, setAnalyzingClipId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set());
  const [analyzingMultiple, setAnalyzingMultiple] = useState(false);

  if (clips.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No clips found</p>
      </div>
    );
  }

  const handleDownload = (clip: XboxClip) => {
    const uri = clip.gameClipUris.find(u => u.uriType === 'Download')?.uri || clip.gameClipUris[0]?.uri;
    if (uri) {
      downloadMedia(uri, `${clip.clipName || clip.gameClipId}.mp4`);
    }
  };

  const handleAnalyzeWithAI = async (clip: XboxClip) => {
    setAnalyzingClipId(clip.gameClipId);
    try {
      const videoUri = clip.gameClipUris.find(u => u.uriType === 'Download')?.uri || clip.gameClipUris[0]?.uri;
      
      if (!videoUri) {
        alert('Video URL not available');
        return;
      }

      const response = await fetch('/api/video-indexer/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: videoUri,
          videoName: clip.clipName || clip.titleName || 'Xbox Clip',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start AI analysis');
      }

      const data = await response.json();
      setAnalyzingClip({
        videoId: data.videoId,
        clipName: clip.clipName || clip.titleName || 'Xbox Clip',
        videoUrl: videoUri,
      });
    } catch (error) {
      console.error('AI analysis error:', error);
      alert('Failed to start AI analysis. Make sure Video Indexer is configured.');
    } finally {
      setAnalyzingClipId(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleClipSelection = (clipId: string) => {
    const newSelection = new Set(selectedClips);
    if (newSelection.has(clipId)) {
      newSelection.delete(clipId);
    } else {
      newSelection.add(clipId);
    }
    setSelectedClips(newSelection);
    
    // Exit selection mode if no clips selected
    if (newSelection.size === 0) {
      setSelectionMode(false);
    }
  };

  const handleAnalyzeMultiple = async () => {
    if (selectedClips.size === 0) return;
    
    setAnalyzingMultiple(true);
    const selectedClipObjects = clips.filter(c => selectedClips.has(c.gameClipId));
    
    try {
      // Analyze all selected clips in parallel
      const analysisPromises = selectedClipObjects.map(async (clip) => {
        const videoUri = clip.gameClipUris.find(u => u.uriType === 'Download')?.uri || clip.gameClipUris[0]?.uri;
        
        if (!videoUri) {
          console.warn(`Video URL not available for ${clip.gameClipId}`);
          return null;
        }

        const response = await fetch('/api/video-indexer/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoUrl: videoUri,
            videoName: clip.clipName || clip.titleName || 'Xbox Clip',
          }),
        });

        if (!response.ok) {
          console.error(`Failed to analyze ${clip.gameClipId}`);
          return null;
        }

        const data = await response.json();
        return {
          videoId: data.videoId,
          clipName: clip.clipName || clip.titleName || 'Xbox Clip',
          videoUrl: videoUri,
        };
      });

      const results = await Promise.all(analysisPromises);
      const successfulAnalyses = results.filter(r => r !== null);

      if (successfulAnalyses.length === 0) {
        alert('Failed to analyze any clips. Please try again.');
        return;
      }

      // Open highlights panel with multiple videos
      setAnalyzingClip({
        videoId: successfulAnalyses.map(r => r!.videoId).join(','),
        clipName: `${successfulAnalyses.length} clips compilation`,
        videoUrl: successfulAnalyses.map(r => r!.videoUrl).join(','),
      });

      // Clear selection
      setSelectedClips(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error('Multi-clip analysis error:', error);
      alert('Failed to analyze clips. Please try again.');
    } finally {
      setAnalyzingMultiple(false);
    }
  };

  return (
    <>
      {/* Selection Toolbar */}
      <div className="mb-4 bg-gray-800 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setSelectionMode(!selectionMode);
              if (selectionMode) {
                setSelectedClips(new Set());
              }
            }}
            className={`px-4 py-2 rounded transition ${
              selectionMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            {selectionMode ? '✓ Selection Mode' : '☐ Select Multiple'}
          </button>
          
          {selectionMode && (
            <span className="text-white">
              {selectedClips.size} clip{selectedClips.size !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>

        {selectionMode && selectedClips.size > 0 && (
          <button
            onClick={handleAnalyzeMultiple}
            disabled={analyzingMultiple}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white px-6 py-2 rounded transition flex items-center gap-2"
          >
            {analyzingMultiple ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                Analyzing...
              </>
            ) : (
              <>
                🤖 Analyze & Create Compilation
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {clips.map((clip) => {
          const thumbnailUri = clip.thumbnails[0]?.uri;
          const videoUri = clip.gameClipUris.find(u => u.uriType === 'Download')?.uri || clip.gameClipUris[0]?.uri;

          return (
            <div key={clip.gameClipId} className={`bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition relative ${
              selectedClips.has(clip.gameClipId) ? 'ring-4 ring-blue-500' : ''
            }`}>
              {selectionMode && (
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedClips.has(clip.gameClipId)}
                    onChange={() => toggleClipSelection(clip.gameClipId)}
                    className="w-6 h-6 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              <div 
                className="relative aspect-video cursor-pointer group" 
                onClick={() => {
                  if (selectionMode) {
                    toggleClipSelection(clip.gameClipId);
                  } else {
                    setSelectedClip(videoUri);
                  }
                }}
              >
                {thumbnailUri && (
                  <Image
                    src={thumbnailUri}
                    alt={clip.userCaption || clip.titleName || 'Xbox Clip'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-60 transition flex items-center justify-center">
                  <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(clip.durationInSeconds)}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold truncate">{clip.titleName || 'Unknown Game'}</h3>
                {clip.userCaption && (
                  <p className="text-gray-400 text-sm mt-1 truncate">{clip.userCaption}</p>
                )}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs">
                      {new Date(clip.dateRecorded).toLocaleDateString()}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {clip.views?.toLocaleString() || 0} views
                    </span>
                  </div>
                  <div className={`grid ${selectionMode ? 'grid-cols-3' : 'grid-cols-4'} gap-2`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailsClip(clip);
                      }}
                      className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-2 py-1 rounded transition"
                      title="View details"
                    >
                      Info
                    </button>
                    {!selectionMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAnalyzeWithAI(clip);
                        }}
                        disabled={analyzingClipId === clip.gameClipId}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white text-sm px-2 py-1 rounded transition flex items-center justify-center"
                        title="Analyze with AI"
                      >
                        {analyzingClipId === clip.gameClipId ? '...' : '🤖'}
                      </button>
                    )}
                    <ShareButton media={clip} mediaType="clip" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(clip);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-2 py-1 rounded transition flex items-center justify-center gap-1"
                      title="Download clip"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span className="hidden xl:inline">DL</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedClip && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedClip(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <video
              src={selectedClip}
              controls
              autoPlay
              className="max-h-[90vh] max-w-full"
            >
              Your browser does not support the video tag.
            </video>
            <button
              onClick={() => setSelectedClip(null)}
              className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {detailsClip && (
        <MediaDetailsPanel
          media={detailsClip}
          mediaType="clip"
          onClose={() => setDetailsClip(null)}
        />
      )}

      {analyzingClip && (
        <HighlightsPanel
          videoId={analyzingClip.videoId}
          videoUrl={analyzingClip.videoUrl}
          onClose={() => setAnalyzingClip(null)}
        />
      )}
    </>
  );
}
