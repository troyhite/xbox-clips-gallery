import { NextRequest, NextResponse } from 'next/server';
import { exchangeTwitchCode } from '@/lib/twitchApi';
import { twitchConfig } from '@/lib/twitchConfig';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    return NextResponse.json(
      { error: error, description: errorDescription },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: 'No authorization code provided' },
      { status: 400 }
    );
  }

  try {
    console.log('Exchanging Twitch code with redirect URI:', twitchConfig.redirectUri);
    
    const tokenResponse = await exchangeTwitchCode(
      code,
      twitchConfig.clientId,
      twitchConfig.clientSecret,
      twitchConfig.redirectUri
    );

    console.log('Twitch token exchange successful');

    return NextResponse.json({
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_in: tokenResponse.expires_in,
      token_type: tokenResponse.token_type,
    });
  } catch (error: any) {
    console.error('Twitch auth error:', error);
    console.error('Redirect URI used:', twitchConfig.redirectUri);
    return NextResponse.json(
      { error: 'Failed to authenticate with Twitch', details: error.message },
      { status: 500 }
    );
  }
}
