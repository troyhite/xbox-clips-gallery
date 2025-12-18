import { NextRequest, NextResponse } from 'next/server';
import { TwitchApiClient } from '@/lib/twitchApi';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    const client = new TwitchApiClient(accessToken);

    // Create a clip from the current live stream or recent VOD
    const result = await client.createClip();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error creating Twitch clip:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create clip' },
      { status: 500 }
    );
  }
}
