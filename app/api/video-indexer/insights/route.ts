import { NextRequest, NextResponse } from 'next/server';
import { trackEvent, trackException } from '@/lib/appInsights';
import { DefaultAzureCredential } from '@azure/identity';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    trackEvent('VideoIndexer_GetInsightsStarted');
    
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
    const duration = Date.now() - startTime;

    console.log('Video Indexer State:', insights.state);
    console.log('Processing Progress:', insights.videos?.[0]?.processingProgress);
    
    if (insights.state === 'Failed') {
      console.error('Video Indexer processing failed:', insights.videos?.[0]?.failureCode, insights.videos?.[0]?.failureMessage);
    }

    // Extract key highlights
    const highlights = extractHighlights(insights);

    trackEvent('VideoIndexer_GetInsightsSuccess', {
      duration,
      videoId,
      labelsCount: insights.summarizedInsights?.labels?.length || 0,
      topicsCount: insights.summarizedInsights?.topics?.length || 0,
    });

    return NextResponse.json({
      videoId,
      state: insights.state,
      processingProgress: insights.videos?.[0]?.processingProgress || '0%',
      insights: highlights,
      fullInsights: insights,
      failureCode: insights.videos?.[0]?.failureCode,
      failureMessage: insights.videos?.[0]?.failureMessage,
    });
  } catch (error) {
    console.error('Video Indexer get insights error:', error);
    trackException(error as Error, {
      operation: 'VideoIndexer_GetInsights',
      duration: Date.now() - startTime,
    });
    return NextResponse.json(
      { error: 'Failed to get video insights' },
      { status: 500 }
    );
  }
}

function extractHighlights(insights: any) {
  const summarized = insights.summarizedInsights || {};
  const videos = insights.videos?.[0] || {};
  
  return {
    // Top detected labels/objects
    labels: (summarized.labels || []).slice(0, 10).map((label: any) => ({
      name: label.name,
      confidence: label.appearances?.[0]?.confidence || 0,
      instances: label.appearances?.length || 0,
    })),
    
    // Key topics
    topics: (summarized.topics || []).slice(0, 5).map((topic: any) => ({
      name: topic.name,
      confidence: topic.confidence,
      referenceUrl: topic.referenceUrl,
    })),
    
    // Detected faces/people
    faces: (summarized.faces || []).slice(0, 5).map((face: any) => ({
      name: face.name || 'Unknown',
      confidence: face.confidence,
      thumbnailId: face.thumbnailId,
    })),
    
    // Key moments (scenes with high activity)
    scenes: (videos.insights?.scenes || []).map((scene: any) => ({
      id: scene.id,
      startTime: scene.instances?.[0]?.start || '0:00:00',
      endTime: scene.instances?.[0]?.end || '0:00:00',
    })),
    
    // Transcript highlights
    transcript: (videos.insights?.transcript || []).slice(0, 5).map((entry: any) => ({
      text: entry.text,
      confidence: entry.confidence,
      startTime: entry.instances?.[0]?.start || '0:00:00',
    })),
    
    // Detected emotions
    emotions: (summarized.emotions || []).map((emotion: any) => ({
      type: emotion.type,
      instances: emotion.appearances?.length || 0,
    })),
    
    // Audio effects
    audioEffects: (videos.insights?.audioEffects || []).slice(0, 5).map((effect: any) => ({
      type: effect.audioEffectKey,
      instances: effect.instances?.length || 0,
    })),
  };
}
