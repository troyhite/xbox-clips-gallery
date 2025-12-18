import { NextRequest, NextResponse } from 'next/server';
import { TwitchApiClient } from '@/lib/twitchApi';
import { twitchConfig } from '@/lib/twitchConfig';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('user_id');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'No access token provided' },
      { status: 401 }
    );
  }

  if (!userId) {
    return NextResponse.json(
      { error: 'user_id parameter is required' },
      { status: 400 }
    );
  }

  const accessToken = authHeader.substring(7);

  try {
    const client = new TwitchApiClient(accessToken, twitchConfig.clientId);
    const analytics = await client.getGameAnalytics(userId);

    return NextResponse.json({ analytics });
  } catch (error: any) {
    console.error('Error fetching Twitch analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Twitch analytics', details: error.message },
      { status: 500 }
    );
  }
}
