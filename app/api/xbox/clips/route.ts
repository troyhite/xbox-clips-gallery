import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
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
    return NextResponse.json(data);
  } catch (error) {
    console.error('Clips fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Xbox clips' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const authData = authHeader.replace('Bearer ', '');
    const { token, userHash } = JSON.parse(authData);
    const { searchParams } = new URL(request.url);
    const xuid = searchParams.get('xuid');
    const gameClipId = searchParams.get('gameClipId');

    if (!xuid || !gameClipId) {
      return NextResponse.json({ error: 'XUID and gameClipId are required' }, { status: 400 });
    }

    // Delete game clip
    const response = await fetch(
      `https://gameclipsmetadata.xboxlive.com/users/xuid(${xuid})/clips/${gameClipId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `XBL3.0 x=${userHash};${token}`,
          'x-xbl-contract-version': '5',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to delete clip:', error);
      return NextResponse.json({ error: 'Failed to delete clip' }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Clip delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete Xbox clip' },
      { status: 500 }
    );
  }
}
