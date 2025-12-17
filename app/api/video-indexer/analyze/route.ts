import { NextRequest, NextResponse } from 'next/server';
import { trackEvent, trackException } from '@/lib/appInsights';
import { DefaultAzureCredential } from '@azure/identity';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    trackEvent('VideoIndexer_AnalyzeStarted');
    
    const { videoUrl, videoName } = await request.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    const accountId = process.env.AZURE_VIDEO_INDEXER_ACCOUNT_ID;
    const location = process.env.AZURE_VIDEO_INDEXER_LOCATION || 'centralus';
    const resourceId = process.env.AZURE_VIDEO_INDEXER_RESOURCE_ID;

    if (!accountId || !resourceId) {
      console.error('Video Indexer credentials not configured');
      return NextResponse.json(
        { error: 'Video Indexer not configured. Add credentials to environment variables.' },
        { status: 500 }
      );
    }

    // Get Azure AD token for Video Indexer management operations
    console.log('Getting Azure AD token...');
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
        permissionType: 'Contributor',
        scope: 'Account',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to generate Video Indexer token:', tokenResponse.status, errorText);
      throw new Error(`Failed to generate token: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.accessToken;

    // Send video URL to Video Indexer - let it download directly
    console.log('Submitting video URL to Video Indexer with Animation preset...');
    const uploadUrl = new URL(
      `https://api.videoindexer.ai/${location}/Accounts/${accountId}/Videos`
    );
    uploadUrl.searchParams.append('accessToken', accessToken);
    uploadUrl.searchParams.append('name', videoName || 'Xbox Clip');
    uploadUrl.searchParams.append('privacy', 'Private');
    uploadUrl.searchParams.append('indexingPreset', 'AdvancedVideo'); // AI features
    uploadUrl.searchParams.append('videoAnalyzerPreset', 'Animation'); // Optimized for gaming/animated content
    uploadUrl.searchParams.append('preventDuplicates', 'false'); // Allow re-analysis of same video
    uploadUrl.searchParams.append('videoUrl', videoUrl); // Let Video Indexer download from URL

    const uploadResponse = await fetch(uploadUrl.toString(), {
      method: 'POST',
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      
      // Check if it's a duplicate video error
      if (uploadResponse.status === 409) {
        try {
          const errorData = JSON.parse(errorText);
          const existingVideoIdMatch = errorData.Message?.match(/video id: '([^']+)'/);
          
          if (existingVideoIdMatch) {
            const existingVideoId = existingVideoIdMatch[1];
            console.log(`Video already exists with ID: ${existingVideoId}, using existing video`);
            
            const duration = Date.now() - startTime;
            trackEvent('VideoIndexer_AnalyzeSuccess', {
              duration,
              videoId: existingVideoId,
              existingVideo: true,
            });

            return NextResponse.json({
              videoId: existingVideoId,
              accountId,
              location,
              message: 'Using existing video analysis',
            });
          }
        } catch (parseError) {
          console.error('Failed to parse duplicate error:', parseError);
        }
      }
      
      throw new Error(`Failed to upload video: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    const duration = Date.now() - startTime;

    trackEvent('VideoIndexer_AnalyzeSuccess', {
      duration,
      videoId: uploadData.id,
    });

    return NextResponse.json({
      videoId: uploadData.id,
      accountId,
      location,
      message: 'Video submitted for AI analysis',
    });
  } catch (error) {
    console.error('Video Indexer analysis error:', error);
    trackException(error as Error, {
      operation: 'VideoIndexer_Analyze',
      duration: Date.now() - startTime,
    });
    return NextResponse.json(
      { error: 'Failed to submit video for analysis' },
      { status: 500 }
    );
  }
}
