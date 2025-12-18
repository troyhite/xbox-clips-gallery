import { NextRequest, NextResponse } from 'next/server';
import { trackEvent, trackException } from '@/lib/appInsights';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    trackEvent('XboxAchievements_Started');
    const authHeader = request.headers.get('authorization');
    const xuid = request.nextUrl.searchParams.get('xuid');

    console.log('Achievements request:', { 
      hasAuthHeader: !!authHeader, 
      xuid,
      authHeaderPreview: authHeader?.substring(0, 50)
    });

    if (!authHeader || !xuid) {
      console.error('Missing required parameters:', { authHeader: !!authHeader, xuid });
      return NextResponse.json({ error: 'Authorization and xuid required' }, { status: 401 });
    }

    const authData = authHeader.replace('Bearer ', '');
    let token, userHash;
    
    try {
      const parsed = JSON.parse(authData);
      token = parsed.token;
      userHash = parsed.userHash;
      console.log('Auth data parsed:', { hasToken: !!token, hasUserHash: !!userHash });
    } catch (parseError) {
      console.error('Failed to parse auth data:', parseError);
      return NextResponse.json({ error: 'Invalid authorization format' }, { status: 401 });
    }

    // Use the Xbox Live achievements REST API v2
    // Documentation: https://github.com/MicrosoftDocs/xbox-live-docs/blob/docs/xbox-live-docs-pr/api-ref/xbox-live-rest/uri/achievements/uri-achievementsusersxuidachievementsgetv2.md
    const response = await fetch(
      `https://achievements.xboxlive.com/users/xuid(${xuid})/achievements?orderBy=UnlockTime&maxItems=50`,
      {
        headers: {
          'Authorization': `XBL3.0 x=${userHash};${token}`,
          'x-xbl-contract-version': '2',
          'Accept': 'application/json',
          'Accept-Language': 'en-US',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to fetch Xbox achievements:', {
        status: response.status,
        statusText: response.statusText,
        error,
        url: `https://achievements.xboxlive.com/users/xuid(${xuid})/achievements`,
      });
      // Return empty array instead of error - achievements are optional
      return NextResponse.json({ 
        achievements: [],
        message: `Achievements API returned ${response.status}`,
        error: error
      });
    }

    const data = await response.json();
    console.log('Xbox achievements response:', {
      hasAchievements: !!data.achievements,
      count: data.achievements?.length || 0,
      pagingInfo: data.pagingInfo
    });
    
    let allAchievements: any[] = data.achievements || [];
    
    // Filter for unlocked achievements only and sort by unlock time (most recent first)
    const unlockedAchievements = allAchievements
      .filter((achievement: any) => 
        achievement.progressState === 'Achieved' && 
        achievement.progression?.timeUnlocked
      )
      .sort((a: any, b: any) => {
        const dateA = new Date(a.progression.timeUnlocked).getTime();
        const dateB = new Date(b.progression.timeUnlocked).getTime();
        return dateB - dateA; // Most recent first
      })
      .slice(0, 24); // Limit to 24 most recent achievements

    const duration = Date.now() - startTime;
    trackEvent('XboxAchievements_Success', {
      duration,
      count: unlockedAchievements.length,
      totalAchievements: allAchievements.length,
    });

    console.log('Returning achievements:', {
      unlocked: unlockedAchievements.length,
      total: allAchievements.length
    });

    return NextResponse.json({
      achievements: unlockedAchievements,
    });
  } catch (error) {
    console.error('Achievements fetch error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    trackException(error as Error, {
      operation: 'XboxAchievements',
      duration: Date.now() - startTime,
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch Xbox achievements',
        details: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.name : typeof error
      },
      { status: 500 }
    );
  }
}
