import { NextRequest, NextResponse } from 'next/server';
import { trackEvent, trackException } from '@/lib/appInsights';

const COMPILATION_SERVICE_URL = process.env.VIDEO_COMPILATION_SERVICE_URL;

interface HighlightClip {
  start: string;
  end: string;
  reason?: string;
  videoUrl: string; // Now required for multi-video support
}

export async function POST(request: NextRequest) {
  try {
    trackEvent('CompilationStarted');

    const { videoId, clips } = await request.json();

    if (!videoId || !clips || !Array.isArray(clips) || clips.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: videoId and clips array required' },
        { status: 400 }
      );
    }

    // Validate all clips have videoUrl
    const missingUrl = clips.some((c: HighlightClip) => !c.videoUrl);
    if (missingUrl) {
      return NextResponse.json(
        { error: 'All clips must have a videoUrl' },
        { status: 400 }
      );
    }

    if (!COMPILATION_SERVICE_URL) {
      return NextResponse.json(
        { error: 'Video compilation service not configured' },
        { status: 500 }
      );
    }

    // Count unique video sources
    const uniqueVideos = new Set(clips.map((c: HighlightClip) => c.videoUrl)).size;
    console.log(`Creating compilation from ${clips.length} clips across ${uniqueVideos} video(s)`);
    console.log('Clips being sent:', JSON.stringify(clips.map((c: HighlightClip) => ({ 
      start: c.start, 
      end: c.end,
      videoUrl: c.videoUrl.substring(0, 50) + '...' // Truncate URL for logging
    })), null, 2));

    // Call the video compilation microservice with extended timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000); // 10 minutes

    try {
      const response = await fetch(`${COMPILATION_SERVICE_URL}/compile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          clips: clips.map((c: HighlightClip) => ({ 
            start: c.start, 
            end: c.end, 
            videoUrl: c.videoUrl
          })),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Compilation service error: ${response.status} - ${error}`);
      }

        const data = await response.json();

      trackEvent('CompilationCompleted', {
        videoId,
        clipsCount: clips.length.toString(),
      });

      return NextResponse.json({
        videoId: data.videoId,
        compilationUrl: data.compilationUrl,
        clipsCount: data.clipsCount,
        processingTime: data.processingTime,
        message: `Compilation created with ${clips.length} highlight moments`,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Compilation creation error:', error);
    trackException(error as Error, {
      operation: 'create-compilation',
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create compilation' },
      { status: 500 }
    );
  }
}