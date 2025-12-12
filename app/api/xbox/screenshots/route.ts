import { NextRequest, NextResponse } from 'next/server';
import { trackEvent, trackException } from '@/lib/appInsights';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    trackEvent('XboxScreenshots_Started');
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

    // Fetch screenshots
    const response = await fetch(
      `https://screenshotsmetadata.xboxlive.com/users/xuid(${xuid})/screenshots`,
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
      console.error('Failed to fetch screenshots:', error);
      return NextResponse.json({ error: 'Failed to fetch screenshots' }, { status: response.status });
    }

    const data = await response.json();
    const duration = Date.now() - startTime;
    const screenshotCount = data.screenshots?.length || 0;

    trackEvent('XboxScreenshots_Success', {
      duration,
      screenshotCount,
      xuid,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Screenshots fetch error:', error);
    trackException(error as Error, {
      operation: 'XboxScreenshots',
      duration: Date.now() - startTime,
    });
    return NextResponse.json(
      { error: 'Failed to fetch Xbox screenshots' },
      { status: 500 }
    );
  }
}
