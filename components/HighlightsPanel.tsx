'use client';

import { useState, useEffect } from 'react';
import CompilationStatusModal from './CompilationStatusModal';

// Helper function to convert time string to seconds
function timeToSeconds(time: string): number {
  const parts = time.split(':');
  const hours = parseInt(parts[0] || '0');
  const minutes = parseInt(parts[1] || '0');
  const seconds = parseFloat(parts[2] || '0');
  return hours * 3600 + minutes * 60 + seconds;
}

interface Label {
  name: string;
  confidence: number;
  instances: number;
}

interface Topic {
  name: string;
  confidence: number;
  referenceUrl?: string;
}

interface Face {
  name: string;
  confidence: number;
  thumbnailId?: string;
}

interface Scene {
  id: number;
  startTime: string;
  endTime: string;
}

interface Emotion {
  type: string;
  instances: number;
}

interface AudioEffect {
  type: string;
  instances: number;
}

interface HighlightClip {
  start: string;
  end: string;
  videoUrl: string;
  reason: string;
}

interface HighlightsPanelProps {
  videoId: string;
  videoUrl: string;
  onClose: () => void;
}

export default function HighlightsPanel({ videoId, videoUrl, onClose }: HighlightsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [highlightClips, setHighlightClips] = useState<HighlightClip[]>([]);
  const [findingMoments, setFindingMoments] = useState(false);
  const [compilationUrl, setCompilationUrl] = useState<string | null>(null);
  const [creatingCompilation, setCreatingCompilation] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<string>('0%');
  const [compilationJobId, setCompilationJobId] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    const videoIds = videoId.split(',');
    const isMultiVideo = videoIds.length > 1;

    const fetchInsights = async () => {
      try {
        if (isMultiVideo) {
          // For multiple videos, poll all until they're all processed
          const responses = await Promise.all(
            videoIds.map(id => fetch(`/api/video-indexer/insights?videoId=${id}`).then(r => r.json()))
          );
          
          const allProcessed = responses.every(data => data.state === 'Processed');
          const anyFailed = responses.some(data => data.state === 'Failed');
          
          if (allProcessed) {
            // Combine insights from all videos
            const combinedInsights = {
              labels: responses.flatMap(r => r.insights?.labels || []),
              topics: responses.flatMap(r => r.insights?.topics || []),
              faces: responses.flatMap(r => r.insights?.faces || []),
              scenes: responses.flatMap(r => r.insights?.scenes || []),
              transcript: responses.flatMap(r => r.insights?.transcript || []),
              emotions: responses.flatMap(r => r.insights?.emotions || []),
              audioEffects: responses.flatMap(r => r.insights?.audioEffects || []),
              videos: responses.map(r => r.insights)
            };
            setInsights(combinedInsights);
            setLoading(false);
            if (pollInterval) clearInterval(pollInterval);
          } else if (anyFailed) {
            setError('One or more videos failed to process');
            setLoading(false);
            if (pollInterval) clearInterval(pollInterval);
          } else {
            // Calculate average progress
            const avgProgress = responses.reduce((sum, r) => {
              const progress = parseInt(r.processingProgress || '0');
              return sum + progress;
            }, 0) / responses.length;
            setProcessingProgress(Math.round(avgProgress) + '%');
            
            if (!pollInterval) {
              pollInterval = setInterval(fetchInsights, 5000);
            }
          }
        } else {
          // Single video processing (existing logic)
          const response = await fetch(`/api/video-indexer/insights?videoId=${videoId}`);
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          console.log('Video Indexer state:', data.state, 'Progress:', data.processingProgress);
          
          if (data.state === 'Processed') {
            setInsights(data.insights);
            setLoading(false);
            if (pollInterval) clearInterval(pollInterval);
          } else if (data.state === 'Failed') {
            setError(`AI analysis failed: ${data.failureMessage || 'Unknown error'}`);
            setLoading(false);
            if (pollInterval) clearInterval(pollInterval);
          } else if (data.state === 'Processing' || data.state === 'Uploaded') {
            setProcessingProgress(data.processingProgress || '0%');
            if (!pollInterval) {
              pollInterval = setInterval(fetchInsights, 5000);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load AI insights:', err);
        setError(`Failed to load AI insights: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setLoading(false);
        if (pollInterval) clearInterval(pollInterval);
      }
    };

    fetchInsights();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [videoId]);

  const findBestMoments = async () => {
    setFindingMoments(true);
    try {
      const videoIds = videoId.split(',');
      const videoUrls = videoUrl.split(',');
      
      if (videoIds.length > 1) {
        // Multiple videos - get highlights from each and combine
        const allHighlights: HighlightClip[] = [];
        
        for (let i = 0; i < videoIds.length; i++) {
          const response = await fetch(`/api/video-indexer/find-highlights?videoId=${videoIds[i]}`);
          const data = await response.json();
          
          // Add video URL to each highlight clip
          const highlightsWithUrl = (data.highlights || []).map((h: Omit<HighlightClip, 'videoUrl'>) => ({
            ...h,
            videoUrl: videoUrls[i]
          }));
          
          allHighlights.push(...highlightsWithUrl);
        }
        
        // Sort by confidence/reason (keep the best moments from all videos)
        setHighlightClips(allHighlights.slice(0, 10)); // Top 10 moments across all videos
      } else {
        // Single video
        const response = await fetch(`/api/video-indexer/find-highlights?videoId=${videoId}`);
        const data = await response.json();
        const highlightsWithUrl = (data.highlights || []).map((h: Omit<HighlightClip, 'videoUrl'>) => ({
          ...h,
          videoUrl
        }));
        setHighlightClips(highlightsWithUrl);
      }
    } catch (err) {
      console.error('Failed to find highlights:', err);
    } finally {
      setFindingMoments(false);
    }
  };

  const createCompilation = async () => {
    setCreatingCompilation(true);
    try {
      const response = await fetch('/api/video-indexer/create-compilation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          clips: highlightClips.map(clip => ({
            start: clip.start,
            end: clip.end,
            videoUrl: clip.videoUrl
          }))
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.jobId) {
        setCompilationJobId(data.jobId);
        setShowStatusModal(true);
      } else {
        throw new Error('No job ID returned');
      }
    } catch (err) {
      console.error('Failed to create compilation:', err);
      alert(`Failed to create compilation: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setCreatingCompilation(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-white mb-2">Analyzing with AI</h2>
            <p className="text-gray-400 mb-4">Processing video with Azure Video Indexer...</p>
            <div className="mb-4">
              <div className="text-blue-400 font-semibold mb-2">Progress: {processingProgress}</div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: processingProgress }}
                />
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-6">This usually takes 1-2 minutes</p>
            <button onClick={onClose} className="mt-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white">Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">Error</h2>
            <p className="text-gray-400 mb-6">{error || 'No insights available'}</p>
            <button onClick={onClose} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white">Close</button>
          </div>
        </div>
      </div>
    );
  }

  // Aggregate insights from potentially multiple videos
  const allVideos = insights?.videos || [];
  const labels = allVideos.flatMap((v: any) => v.insights?.labels || []);
  const topics = allVideos.flatMap((v: any) => v.insights?.topics || []);
  const faces = allVideos.flatMap((v: any) => v.insights?.faces || []);
  const scenes = allVideos.flatMap((v: any) => v.insights?.scenes || []);
  const emotions = allVideos.flatMap((v: any) => v.insights?.emotions || []);
  const audioEffects = allVideos.flatMap((v: any) => v.insights?.audioEffectCategories || []);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">🤖 AI Insights</h2>
            {videoId.includes(',') && (
              <p className="text-gray-400 text-sm mt-1">Analyzing {videoId.split(',').length} clips</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl">×</button>
        </div>
        
        <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
          {labels.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Labels Detected</h3>
              <div className="space-y-2">
                {labels.slice(0, 10).map((label: Label, idx: number) => (
                  <div key={idx} className="bg-gray-700 rounded p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white font-medium">{label.name}</span>
                      <span className="text-gray-400 text-sm">{Math.round(label.confidence * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: (label.confidence * 100) + '%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {topics.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Topics</h3>
              <div className="flex flex-wrap gap-2">
                {topics.slice(0, 15).map((topic: Topic, idx: number) => (
                  <a
                    key={idx}
                    href={topic.referenceUrl || '#'}
                    target={topic.referenceUrl ? '_blank' : undefined}
                    rel={topic.referenceUrl ? 'noopener noreferrer' : undefined}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-full text-sm text-white"
                  >
                    {topic.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {faces.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">People Detected</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {faces.slice(0, 6).map((face: Face, idx: number) => (
                  <div key={idx} className="bg-gray-700 rounded p-3 text-center">
                    <div className="text-white font-medium mb-1">{face.name || 'Unknown'}</div>
                    <div className="text-gray-400 text-sm">{Math.round(face.confidence * 100)}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {emotions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Emotions Detected</h3>
              <div className="flex flex-wrap gap-2">
                {emotions.map((emotion: Emotion, idx: number) => (
                  <div key={idx} className="bg-purple-600 px-4 py-2 rounded-lg text-white">
                    <span className="font-medium">{emotion.type}</span>
                    <span className="ml-2 text-purple-200 text-sm">×{emotion.instances}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {audioEffects.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Audio Effects</h3>
              <div className="flex flex-wrap gap-2">
                {audioEffects.map((effect: AudioEffect, idx: number) => (
                  <div key={idx} className="bg-green-600 px-4 py-2 rounded-lg text-white">
                    <span className="font-medium">{effect.type}</span>
                    <span className="ml-2 text-green-200 text-sm">×{effect.instances}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700 space-y-4">
          <button 
            onClick={findBestMoments}
            disabled={findingMoments}
            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded text-white font-semibold"
          >
            {findingMoments ? 'Finding Best Moments...' : '✨ Find Best Moments'}
          </button>

          {highlightClips.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Highlight Clips ({highlightClips.length})</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {highlightClips.map((clip, idx) => {
                  const jumpUrl = clip.videoUrl + '#t=' + timeToSeconds(clip.start).toString();
                  return (
                    <div key={idx} className="bg-gray-700 rounded p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-white font-medium">Clip {idx + 1}</div>
                          <div className="text-gray-400 text-sm">{clip.start} - {clip.end}</div>
                          <div className="text-gray-500 text-xs mt-1">{clip.reason}</div>
                        </div>
                        <a
                          href={jumpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white"
                        >
                          Jump to moment
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button 
                onClick={createCompilation}
                disabled={creatingCompilation}
                className="w-full mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-white font-semibold"
              >
                {creatingCompilation ? 'Creating Compilation...' : '🎬 Create Compilation Video'}
              </button>

              {compilationUrl && (
                <div className="mt-4 p-4 bg-green-900/50 border border-green-600 rounded">
                  <div className="text-green-400 font-semibold mb-2">✅ Compilation Ready!</div>
                  <a
                    href={compilationUrl}
                    download
                    className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
                  >
                    Download Compilation
                  </a>
                </div>
              )}
            </div>
          )}

          <button 
            onClick={onClose}
            className="w-full px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
          >
            Close
          </button>
        </div>
      </div>

      <CompilationStatusModal
        isOpen={showStatusModal}
        jobId={compilationJobId}
        onClose={() => {
          setShowStatusModal(false);
          setCreatingCompilation(false);
        }}
        onComplete={() => {
          // Compilation completed successfully
          console.log('Compilation completed!');
        }}
      />
    </div>
  );
}
