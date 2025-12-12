import { NextRequest, NextResponse } from 'next/server';
import { trackEvent, trackException } from '@/lib/appInsights';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    trackEvent('XboxClips_Started');
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const authData = authHeader.replace('Bearer ', '');
    const { token, userHash } = JSON.parse(authData);
    const { searchParams } = new URL(request.url);
    const xuid = searchParams.get('xuid');

    if (!xuid) {
      return NextResponse.json({ error: 'XUID is required' }, { status: 400 });
    }

    // Fetch game clips
    const response = await fetch(
      `https://gameclipsmetadata.xboxlive.com/users/xuid(${xuid})/clips`,
      {
        headers: {
          'Authorization': `XBL3.0 x=${userHash};${token}`,
          'x-xbl-contract-version': '5',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to fetch clips:', error);
      return NextResponse.json({ error: 'Failed to fetch clips' }, { status: response.status });
    }

    const data = await response.json();
    const duration = Date.now() - startTime;
    const clipCount = data.gameClips?.length || 0;

    trackEvent('XboxClips_Success', {
      duration,
      clipCount,
      xuid,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Clips fetch error:', error);
    trackException(error as Error, {
      operation: 'XboxClips',
      duration: Date.now() - startTime,
    });
    return NextResponse.json(
      { error: 'Failed to fetch Xbox clips' },
      { status: 500 }
    );
  }
}
