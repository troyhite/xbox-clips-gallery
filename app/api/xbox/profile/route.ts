import { NextRequest, NextResponse } from 'next/server';
import { trackEvent, trackException } from '@/lib/appInsights';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    trackEvent('XboxProfile_Started');
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const authData = authHeader.replace('Bearer ', '');
    const { token, userHash } = JSON.parse(authData);

    // Get Xbox profile
    const response = await fetch(
      'https://profile.xboxlive.com/users/me/profile/settings?settings=Gamertag,Gamerscore,AccountTier,XboxOneRep,PreferredColor,RealName,Bio,Location,ModernGamertag,ModernGamertagSuffix,UniqueModernGamertag,GameDisplayPicRaw',
      {
        headers: {
          'Authorization': `XBL3.0 x=${userHash};${token}`,
          'x-xbl-contract-version': '3',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to fetch Xbox profile:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: response.status });
    }

    const data = await response.json();
    const profileUser = data.profileUsers?.[0];

    if (!profileUser) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const settings = profileUser.settings.reduce((acc: any, setting: any) => {
      acc[setting.id] = setting.value;
      return acc;
    }, {});

    const duration = Date.now() - startTime;
    trackEvent('XboxProfile_Success', {
      duration,
      gamertag: settings.Gamertag || settings.ModernGamertag,
      gamerscore: settings.Gamerscore,
    });

    return NextResponse.json({
      xuid: profileUser.id,
      gamertag: settings.Gamertag || settings.ModernGamertag,
      displayPicRaw: settings.GameDisplayPicRaw || `https://avatar-ssl.xboxlive.com/avatar/${profileUser.id}/avatar-body.png`,
      gamerscore: settings.Gamerscore,
      accountTier: settings.AccountTier,
      realName: settings.RealName,
      bio: settings.Bio,
      location: settings.Location,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    trackException(error as Error, {
      operation: 'XboxProfile',
      duration: Date.now() - startTime,
    });
    return NextResponse.json(
      { error: 'Failed to fetch Xbox profile' },
      { status: 500 }
    );
  }
}
