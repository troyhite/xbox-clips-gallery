import { NextRequest, NextResponse } from 'next/server';
import { DefaultAzureCredential } from '@azure/identity';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const compilationVideoId = searchParams.get('videoId');

    if (!compilationVideoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const accountId = process.env.AZURE_VIDEO_INDEXER_ACCOUNT_ID;
    const location = process.env.AZURE_VIDEO_INDEXER_LOCATION || 'centralus';
    const resourceId = process.env.AZURE_VIDEO_INDEXER_RESOURCE_ID;

    if (!accountId || !resourceId) {
      return NextResponse.json({ error: 'Video Indexer not configured' }, { status: 500 });
    }

    // Get Azure AD token
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
        permissionType: 'Reader',
        scope: 'Video',
        videoId: compilationVideoId,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to generate token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.accessToken;

    // Get video status
    const statusUrl = `https://api.videoindexer.ai/${location}/Accounts/${accountId}/Videos/${compilationVideoId}/Index?accessToken=${accessToken}`;
    const statusResponse = await fetch(statusUrl);

    if (!statusResponse.ok) {
      throw new Error('Failed to get video status');
    }

    const status = await statusResponse.json();
    const state = status.state;
    const processingProgress = status.videos?.[0]?.processingProgress || '0%';

    let downloadUrl = '';
    let streamingUrl = '';

    if (state === 'Processed') {
      // Get download URL
      const downloadUrlEndpoint = `https://api.videoindexer.ai/${location}/Accounts/${accountId}/Videos/${compilationVideoId}/SourceFile/DownloadUrl?accessToken=${accessToken}`;
      const downloadResponse = await fetch(downloadUrlEndpoint);
      
      if (downloadResponse.ok) {
        downloadUrl = await downloadResponse.text();
        downloadUrl = downloadUrl.replace(/"/g, '');
      }

      // Get streaming URL
      const streamingUrlEndpoint = `https://api.videoindexer.ai/${location}/Accounts/${accountId}/Videos/${compilationVideoId}/StreamingUrl?accessToken=${accessToken}`;
      const streamingResponse = await fetch(streamingUrlEndpoint);
      
      if (streamingResponse.ok) {
        streamingUrl = await streamingResponse.text();
        streamingUrl = streamingUrl.replace(/"/g, '');
      }
    }

    return NextResponse.json({
      state,
      processingProgress,
      downloadUrl,
      streamingUrl,
      compilationVideoId,
    });
  } catch (error) {
    console.error('Get compilation status error:', error);
    return NextResponse.json({ error: 'Failed to get compilation status' }, { status: 500 });
  }
}
