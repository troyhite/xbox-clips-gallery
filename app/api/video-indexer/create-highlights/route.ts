import { NextRequest, NextResponse } from 'next/server';
import { trackEvent, trackException } from '@/lib/appInsights';
import { DefaultAzureCredential } from '@azure/identity';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    trackEvent('VideoIndexer_CreateHighlightsStarted');
    
    const { videoId } = await request.json();

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

    // Get Azure AD token
    console.log('Getting Azure AD token for highlights creation...');
    const credential = new DefaultAzureCredential();
    const armToken = await credential.getToken('https://management.azure.com/.default');

    // Generate Video Indexer access token
    const generateTokenUrl = `https://management.azure.com${resourceId}/generateAccessToken?api-version=2024-01-01`;
    
    const tokenResponse = await fetch(generateTokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${armToken.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        permissionType: 'Contributor',
        scope: 'Video',
        videoId: videoId,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to generate token: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.accessToken;

    // Get video insights to find highlights
    console.log('Fetching video insights...');
    const insightsUrl = `https://api.videoindexer.ai/${location}/Accounts/${accountId}/Videos/${videoId}/Index?accessToken=${accessToken}`;
    const insightsResponse = await fetch(insightsUrl);
    
    if (!insightsResponse.ok) {
      throw new Error('Failed to fetch insights');
    }

    const insights = await insightsResponse.json();
    
    // Select highlight moments based on:
    // 1. High emotion intensity (joy, excitement)
    // 2. Audio effects (explosions, cheers)
    // 3. Scene changes with high activity
    const clips = selectHighlightClips(insights);

    if (clips.length === 0) {
      return NextResponse.json({
        message: 'No significant highlights detected',
        clips: [],
      });
    }

    // Return the highlight clips with download URLs
    console.log(`Found ${clips.length} highlight moments`);
    
    // Get the video download URL
    const downloadUrl = `https://api.videoindexer.ai/${location}/Accounts/${accountId}/Videos/${videoId}/SourceFile/DownloadUrl?accessToken=${accessToken}`;
    const downloadResponse = await fetch(downloadUrl);
    
    let videoUrl = '';
    if (downloadResponse.ok) {
      videoUrl = await downloadResponse.text();
      videoUrl = videoUrl.replace(/"/g, '');
    }
    
    const duration = Date.now() - startTime;

    trackEvent('VideoIndexer_CreateHighlightsSuccess', {
      duration,
      videoId,
      clipsCount: clips.length,
    });

    return NextResponse.json({
      videoId,
      clipsCount: clips.length,
      clips: clips.map(clip => ({
        ...clip,
        videoUrl,
      })),
      videoUrl,
      message: clips.length > 0 ? `Found ${clips.length} highlight moments` : 'No significant highlights detected',
    });
  } catch (error) {
    console.error('Create highlights error:', error);
    trackException(error as Error, {
      operation: 'VideoIndexer_CreateHighlights',
      duration: Date.now() - startTime,
    });
    return NextResponse.json(
      { error: 'Failed to create highlight reel' },
      { status: 500 }
    );
  }
}

function selectHighlightClips(insights: any): Array<{ start: string; end: string; reason: string }> {
  const clips: Array<{ start: string; end: string; score: number; reason: string }> = [];
  const videos = insights.videos?.[0] || {};
  const videoInsights = videos.insights || {};
  const summarizedInsights = insights.summarizedInsights || {};

  console.log('Analyzing video for gaming highlights...');
  
  // Gaming-specific labels to look for
  const gamingLabels = [
    'weapon', 'gun', 'rifle', 'sword', 'explosion', 'fire', 'combat', 'battle',
    'character', 'player', 'enemy', 'fight', 'action', 'shoot', 'gaming',
    'game', 'vehicle', 'car', 'motorcycle', 'helicopter', 'aircraft'
  ];

  // Get all detected labels
  const labels = summarizedInsights.labels || [];
  const labelTimeMap = new Map<string, Array<{start: string, end: string}>>();
  
  labels.forEach((label: any) => {
    const labelName = label.name.toLowerCase();
    const appearances = label.appearances || [];
    const times = appearances.map((app: any) => ({
      start: app.startTime,
      end: app.endTime,
    }));
    labelTimeMap.set(labelName, times);
  });

  // Score scenes based on gaming-specific factors
  const scenes = videoInsights.scenes || [];
  
  if (scenes.length === 0) {
    console.log('No scenes detected, using full video duration');
    // If no scenes detected, create segments from the video
    const duration = parseFloat(videos.duration || '0');
    const segmentLength = Math.min(10, duration / 3); // Max 10 seconds per segment
    
    for (let i = 0; i < duration && clips.length < 5; i += segmentLength) {
      clips.push({
        start: formatTime(i),
        end: formatTime(Math.min(i + segmentLength, duration)),
        score: 1,
        reason: 'video segment',
      });
    }
  } else {
    console.log(`Found ${scenes.length} scenes`);
    
    scenes.forEach((scene: any, sceneIndex: number) => {
      const instances = scene.instances || [];
      
      instances.forEach((instance: any) => {
        let score = 1; // Base score for every scene
        const reasons: string[] = [];
        
        // Give priority to beginning and middle clips (often most action)
        if (sceneIndex < scenes.length / 3) {
          score += 1;
          reasons.push('early action');
        } else if (sceneIndex < 2 * scenes.length / 3) {
          score += 2;
          reasons.push('peak moment');
        }
        
        // Check for gaming-related labels in this timeframe
        let gamingLabelCount = 0;
        labelTimeMap.forEach((times, labelName) => {
          if (gamingLabels.some(gl => labelName.includes(gl))) {
            times.forEach((time: any) => {
              if (overlaps(time.start, time.end, instance.start, instance.end)) {
                gamingLabelCount++;
              }
            });
          }
        });
        
        if (gamingLabelCount > 0) {
          score += gamingLabelCount * 2;
          reasons.push(`${gamingLabelCount} game elements`);
        }
        
        // Check for any audio effects (common in games)
        const audioEffects = videoInsights.audioEffects || [];
        let audioCount = 0;
        audioEffects.forEach((effect: any) => {
          const effectInstances = effect.instances || [];
          effectInstances.forEach((ei: any) => {
            if (overlaps(ei.start, ei.end, instance.start, instance.end)) {
              audioCount++;
            }
          });
        });
        
        if (audioCount > 0) {
          score += audioCount;
          reasons.push(`${audioCount} audio effects`);
        }
        
        // Check for emotions (excitement, joy)
        const emotions = videoInsights.emotions || [];
        emotions.forEach((emotion: any) => {
          if (emotion.type === 'Joy' || emotion.type === 'Excitement') {
            const emotionInstances = emotion.instances || [];
            emotionInstances.forEach((ei: any) => {
              if (overlaps(ei.start, ei.end, instance.start, instance.end)) {
                score += 2;
                reasons.push('excitement detected');
              }
            });
          }
        });
        
        // Check for gaming keywords in transcript
        const transcript = videoInsights.transcript || [];
        transcript.forEach((entry: any) => {
          const text = (entry.text || '').toLowerCase();
          const gamingKeywords = [
            'kill', 'killed', 'death', 'died', 'eliminated',
            'win', 'won', 'victory', 'defeated',
            'score', 'point', 'combo', 'streak',
            'awesome', 'amazing', 'nice', 'perfect', 'critical',
            'yes', 'yeah', 'wow', 'oh', 'ooh'
          ];
          
          if (gamingKeywords.some(word => text.includes(word))) {
            const entryInstances = entry.instances || [];
            entryInstances.forEach((ei: any) => {
              if (overlaps(ei.start, ei.end, instance.start, instance.end)) {
                score += 3;
                reasons.push('exciting commentary');
              }
            });
          }
        });
        
        // Lower threshold - include any scene with score >= 2
        if (score >= 2 || reasons.length > 0) {
          clips.push({
            start: instance.start,
            end: instance.end,
            score,
            reason: reasons.length > 0 ? reasons.join(', ') : 'game footage',
          });
        }
      });
    });
  }
  
  console.log(`Generated ${clips.length} potential highlight clips`);
  
  // Sort by score and take top 5 clips
  clips.sort((a, b) => b.score - a.score);
  const topClips = clips.slice(0, 5);
  
  console.log('Top highlights:', topClips.map(c => `${c.start}-${c.end} (${c.score} pts)`));
  
  return topClips.map(({ start, end, reason }) => ({ start, end, reason }));
}

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

function overlaps(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = timeToSeconds(start1);
  const e1 = timeToSeconds(end1);
  const s2 = timeToSeconds(start2);
  const e2 = timeToSeconds(end2);
  
  return s1 < e2 && e1 > s2;
}

function timeToSeconds(time: string): number {
  const parts = time.split(':');
  const hours = parseInt(parts[0] || '0');
  const minutes = parseInt(parts[1] || '0');
  const seconds = parseFloat(parts[2] || '0');
  return hours * 3600 + minutes * 60 + seconds;
}
