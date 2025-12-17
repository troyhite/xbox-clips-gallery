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

    // Generate unique job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Count unique video sources
    const uniqueVideos = new Set(clips.map((c: HighlightClip) => c.videoUrl)).size;
    console.log(`Creating compilation ${jobId} from ${clips.length} clips across ${uniqueVideos} video(s)`);
    console.log('Clips being sent:', JSON.stringify(clips.map((c: HighlightClip) => ({ 
      start: c.start, 
      end: c.end,
      videoUrl: c.videoUrl.substring(0, 50) + '...' // Truncate URL for logging
    })), null, 2));

    // Update initial status
    await updateCompilationStatus(jobId, 'processing', 'Starting compilation...', 5);

    // Start compilation asynchronously
    processCompilation(jobId, videoId, clips);

    // Return job ID immediately
    return NextResponse.json({
      jobId,
      message: 'Compilation started',
    });
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

async function updateCompilationStatus(
  jobId: string, 
  status: 'processing' | 'completed' | 'failed', 
  message: string, 
  progress: number,
  videoUrl?: string,
  error?: string
) {
  try {
    // For server-side internal calls, we need to use the full URL
    // In production (Azure App Service), use the deployment URL
    // In local dev, use localhost
    const baseUrl = process.env.WEBSITE_HOSTNAME 
      ? `https://${process.env.WEBSITE_HOSTNAME}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const statusUpdateUrl = `${baseUrl}/api/xbox/compilation-status`;
    
    console.log(`Updating compilation status for ${jobId}: ${status} - ${message} (${progress}%)`);
    
    const response = await fetch(statusUpdateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, status, message, progress, videoUrl, error }),
    });
    
    if (!response.ok) {
      console.error(`Failed to update status: ${response.status} ${response.statusText}`);
    }
  } catch (err) {
    console.error('Failed to update status:', err);
  }
}

async function processCompilation(jobId: string, videoId: string, clips: HighlightClip[]) {
  try {
    await updateCompilationStatus(jobId, 'processing', 'Sending clips to compilation service...', 10);

    // Call the video compilation microservice with extended timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000); // 10 minutes

    try {
      await updateCompilationStatus(jobId, 'processing', 'Processing video clips...', 30);

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

      await updateCompilationStatus(jobId, 'processing', 'Finalizing compilation...', 90);
      const data = await response.json();

      trackEvent('CompilationCompleted', {
        videoId,
        clipsCount: clips.length.toString(),
      });

      await updateCompilationStatus(
        jobId, 
        'completed', 
        `Compilation complete! Created video with ${clips.length} highlights`, 
        100,
        data.compilationUrl
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Compilation processing error:', error);
    trackException(error as Error, {
      operation: 'process-compilation',
    });

    await updateCompilationStatus(
      jobId,
      'failed',
      error instanceof Error ? error.message : 'Compilation failed',
      0,
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}