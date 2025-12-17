import { NextRequest, NextResponse } from 'next/server';
import { trackEvent, trackException } from '@/lib/appInsights';
import { DefaultAzureCredential } from '@azure/identity';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    trackEvent('VideoIndexer_FindHighlightsStarted');
    
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const accountId = process.env.AZURE_VIDEO_INDEXER_ACCOUNT_ID;
    const location = process.env.AZURE_VIDEO_INDEXER_LOCATION || 'centralus';
    const resourceId = process.env.AZURE_VIDEO_INDEXER_RESOURCE_ID;

    if (!accountId || !resourceId) {
      return NextResponse.json(
        { error: 'Video Indexer not configured' },
        { status: 500 }
      );
    }

    // Get Azure AD token for Video Indexer management operations
    const credential = new DefaultAzureCredential();
    const armToken = await credential.getToken('https://management.azure.com/.default');

    // Generate Video Indexer access token using ARM
    const generateTokenUrl = `https://management.azure.com${resourceId}/generateAccessToken?api-version=2024-01-01`;
    
    const tokenResponse = await fetch(generateTokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${armToken.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        permissionType: 'Reader',
        scope: 'Video',
        videoId: videoId,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to generate Video Indexer token:', tokenResponse.status, errorText);
      throw new Error(`Failed to generate token: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.accessToken;

    // Get video index (insights)
    const indexUrl = `https://api.videoindexer.ai/${location}/Accounts/${accountId}/Videos/${videoId}/Index?accessToken=${accessToken}`;
    
    const indexResponse = await fetch(indexUrl);

    if (!indexResponse.ok) {
      const error = await indexResponse.text();
      throw new Error(`Failed to get video insights: ${indexResponse.status} - ${error}`);
    }

    const insights = await indexResponse.json();
    
    // Get video details for URL
    const videoUrl = insights.videos?.[0]?.sourceUrl || '';
    
    // Analyze insights to find best moments
    const highlights = findBestMomentsFromInsights(insights, videoUrl);

    console.log(`[${videoId}] Found ${highlights.length} highlights:`, 
      highlights.map(h => `${h.start}-${h.end} (score: ${h.score})`));

    const duration = Date.now() - startTime;
    trackEvent('VideoIndexer_FindHighlightsSuccess', {
      duration,
      videoId,
      highlightsCount: highlights.length,
    });

    return NextResponse.json({
      videoId,
      highlights,
    });
  } catch (error) {
    console.error('Video Indexer find highlights error:', error);
    trackException(error as Error, {
      operation: 'VideoIndexer_FindHighlights',
      duration: Date.now() - startTime,
    });
    return NextResponse.json(
      { error: 'Failed to find highlights' },
      { status: 500 }
    );
  }
}

function timeToSeconds(time: string): number {
  const parts = time.split(':');
  const hours = parseInt(parts[0] || '0');
  const minutes = parseInt(parts[1] || '0');
  const seconds = parseFloat(parts[2] || '0');
  return hours * 3600 + minutes * 60 + seconds;
}

function secondsToTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

interface HighlightClip {
  start: string;
  end: string;
  videoUrl: string;
  reason: string;
  score: number;
}

function findBestMomentsFromInsights(insights: any, videoUrl: string): HighlightClip[] {
  const video = insights.videos?.[0];
  if (!video) return [];

  const videoInsights = video.insights;
  const highlights: HighlightClip[] = [];

  // 1. Look for scenes with high activity (face detection, objects, etc.)
  const scenes = videoInsights?.scenes || [];
  const labels = videoInsights?.labels || [];
  const faces = videoInsights?.faces || [];
  const emotions = videoInsights?.emotions || [];
  const audioEffects = videoInsights?.audioEffects || [];

  // Create a scoring system for each time segment
  const durationInSeconds = timeToSeconds(video.insights.duration || '0:00:10');
  const segmentDuration = 10; // Analyze in 10-second segments
  const segments: { start: number; end: number; score: number; reasons: string[] }[] = [];

  console.log(`Video duration: ${video.insights.duration} (${durationInSeconds}s)`);

  for (let i = 0; i < durationInSeconds; i += segmentDuration) {
    const segmentStart = i;
    const segmentEnd = Math.min(i + segmentDuration, durationInSeconds);
    
    const segment = {
      start: segmentStart,
      end: segmentEnd,
      score: 0,
      reasons: [] as string[],
    };

    // Score based on label activity in this segment
    labels.forEach((label: any) => {
      label.instances?.forEach((instance: any) => {
        const start = timeToSeconds(instance.start || '0:00:00');
        const end = timeToSeconds(instance.end || '0:00:00');
        
        if (start >= segmentStart && start < segmentEnd) {
          segment.score += 1;
          if (segment.reasons.length < 3) {
            segment.reasons.push(`${label.name} detected`);
          }
        }
      });
    });

    // Score based on face appearances
    faces.forEach((face: any) => {
      face.instances?.forEach((instance: any) => {
        const start = timeToSeconds(instance.start || '0:00:00');
        
        if (start >= segmentStart && start < segmentEnd) {
          segment.score += 2; // Faces are important
          if (segment.reasons.length < 3) {
            segment.reasons.push(`${face.name || 'Person'} appears`);
          }
        }
      });
    });

    // Score based on emotions
    emotions.forEach((emotion: any) => {
      emotion.instances?.forEach((instance: any) => {
        const start = timeToSeconds(instance.start || '0:00:00');
        
        if (start >= segmentStart && start < segmentEnd) {
          segment.score += 1.5;
          if (segment.reasons.length < 3) {
            segment.reasons.push(`${emotion.type} emotion`);
          }
        }
      });
    });

    // Score based on audio effects (gunshots, explosions, etc.)
    audioEffects.forEach((effect: any) => {
      effect.instances?.forEach((instance: any) => {
        const start = timeToSeconds(instance.start || '0:00:00');
        
        if (start >= segmentStart && start < segmentEnd) {
          segment.score += 3; // Audio effects are very important for gaming highlights
          if (segment.reasons.length < 3) {
            segment.reasons.push(`${effect.audioEffectKey} sound`);
          }
        }
      });
    });

    // Score based on scene changes (action moments)
    scenes.forEach((scene: any) => {
      scene.instances?.forEach((instance: any) => {
        const start = timeToSeconds(instance.start || '0:00:00');
        
        if (start >= segmentStart && start < segmentEnd) {
          segment.score += 0.5;
        }
      });
    });

    segments.push(segment);
  }

  // Sort segments by score and take top highlights with minimum separation
  segments.sort((a, b) => b.score - a.score);
  
  const topSegments: typeof segments = [];
  const minSeparation = 20; // Minimum 20 seconds between highlights
  
  for (const segment of segments) {
    if (segment.score <= 0) continue;
    
    // Check if this segment is far enough from already selected segments
    const isTooClose = topSegments.some(selected => 
      Math.abs(segment.start - selected.start) < minSeparation
    );
    
    if (!isTooClose) {
      topSegments.push(segment);
    }
    
    // Stop after finding 3 good highlights
    if (topSegments.length >= 3) break;
  }

  // Convert to highlight clips
  topSegments.forEach(segment => {
    highlights.push({
      start: secondsToTime(segment.start),
      end: secondsToTime(segment.end),
      videoUrl,
      reason: segment.reasons.join(', ') || 'High activity detected',
      score: segment.score,
    });
  });

  // Sort by start time
  highlights.sort((a, b) => timeToSeconds(a.start) - timeToSeconds(b.start));

  return highlights;
}
