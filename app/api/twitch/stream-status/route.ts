import { NextRequest, NextResponse } from 'next/server';
import { TwitchApiClient } from '@/lib/twitchApi';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID!;
    const client = new TwitchApiClient(accessToken, clientId);

    // Get user info first
    const user = await client.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to get user information' },
        { status: 500 }
      );
    }

    // Check if user is currently streaming
    const streams = await client.getStreams(user.id);
    const isLive = streams.length > 0;
    const streamData = streams[0] || null;

    return NextResponse.json({
      isLive,
      stream: streamData ? {
        id: streamData.id,
        userId: streamData.user_id,
        userName: streamData.user_name,
        gameId: streamData.game_id,
        gameName: streamData.game_name,
        title: streamData.title,
        viewerCount: streamData.viewer_count,
        startedAt: streamData.started_at,
        thumbnailUrl: streamData.thumbnail_url,
        tags: streamData.tags || [],
      } : null,
    });
  } catch (error: any) {
    console.error('Error checking stream status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check stream status' },
      { status: 500 }
    );
  }
}
