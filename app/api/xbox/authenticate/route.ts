import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 });
    }

    // Authenticate with Xbox Live
    const xboxLiveResponse = await fetch('https://user.auth.xboxlive.com/user/authenticate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        Properties: {
          AuthMethod: 'RPS',
          SiteName: 'user.auth.xboxlive.com',
          RpsTicket: `d=${accessToken}`,
        },
        RelyingParty: 'http://auth.xboxlive.com',
        TokenType: 'JWT',
      }),
    });

    if (!xboxLiveResponse.ok) {
      const error = await xboxLiveResponse.text();
      console.error('Xbox Live authentication failed:', xboxLiveResponse.status, error);
      return NextResponse.json({ 
        error: 'Xbox Live authentication failed', 
        details: error,
        status: xboxLiveResponse.status 
      }, { status: 401 });
    }

    const xboxLiveData = await xboxLiveResponse.json();
    const xboxToken = xboxLiveData.Token;

    // Get XSTS token
    const xstsResponse = await fetch('https://xsts.auth.xboxlive.com/xsts/authorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        Properties: {
          SandboxId: 'RETAIL',
          UserTokens: [xboxToken],
        },
        RelyingParty: 'http://xboxlive.com',
        TokenType: 'JWT',
      }),
    });

    if (!xstsResponse.ok) {
      const error = await xstsResponse.text();
      console.error('XSTS authorization failed:', xstsResponse.status, error);
      return NextResponse.json({ 
        error: 'XSTS authorization failed', 
        details: error,
        status: xstsResponse.status 
      }, { status: 401 });
    }

    const xstsData = await xstsResponse.json();
    const userHash = xstsData.DisplayClaims.xui[0].uhs;

    return NextResponse.json({
      xboxToken: xstsData.Token,
      userHash: userHash,
      xuid: xstsData.DisplayClaims.xui[0].xid,
      gamertag: xstsData.DisplayClaims.xui[0].gtg,
    });
  } catch (error) {
    console.error('Xbox authentication error:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate with Xbox Live' },
      { status: 500 }
    );
  }
}
