import { NextRequest, NextResponse } from 'next/server';
import { TwitchApiClient } from '@/lib/twitchApi';
import { twitchConfig } from '@/lib/twitchConfig';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'No access token provided' },
      { status: 401 }
    );
  }

  const accessToken = authHeader.substring(7);

  try {
    const client = new TwitchApiClient(accessToken, twitchConfig.clientId);
    const user = await client.getUser();

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error fetching Twitch profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Twitch profile', details: error.message },
      { status: 500 }
    );
  }
}
