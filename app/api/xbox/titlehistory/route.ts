import { NextRequest, NextResponse } from 'next/server';
import { trackEvent, trackException } from '@/lib/appInsights';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    trackEvent('XboxTitleHistory_Started');
    const authHeader = request.headers.get('authorization');
    const xuid = request.nextUrl.searchParams.get('xuid');

    if (!authHeader || !xuid) {
      return NextResponse.json({ error: 'Authorization and xuid required' }, { status: 401 });
    }

    const authData = authHeader.replace('Bearer ', '');
    let token, userHash;
    
    try {
      const parsed = JSON.parse(authData);
      token = parsed.token;
      userHash = parsed.userHash;
    } catch (parseError) {
      console.error('Failed to parse auth data:', parseError);
      return NextResponse.json({ error: 'Invalid authorization format' }, { status: 401 });
    }

    // Fetch title history from Xbox Live with achievement decoration
    const response = await fetch(
      `https://titlehub.xboxlive.com/users/xuid(${xuid})/titles/titlehistory/decoration/achievement,detail`,
      {
        headers: {
          'Authorization': `XBL3.0 x=${userHash};${token}`,
          'x-xbl-contract-version': '2',
          'Accept': 'application/json',
          'Accept-Language': 'en-US'
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to fetch Xbox title history:', {
        status: response.status,
        statusText: response.statusText,
        error,
      });
      return NextResponse.json({ 
        titles: [],
        message: `Title history API returned ${response.status}`
      });
    }

    const data = await response.json();
    
    console.log('Title history API response:', {
      hasTitles: !!data.titles,
      rawCount: data.titles?.length || 0,
      firstTitle: data.titles?.[0],
      firstTitleAchievement: data.titles?.[0]?.achievement,
      achievementStructure: JSON.stringify(data.titles?.[0]?.achievement, null, 2)
    });
    
    // Extract and sort titles by last played
    const titles = (data.titles || [])
      .filter((title: any) => title.titleHistory?.lastTimePlayed)
      .sort((a: any, b: any) => {
        const dateA = new Date(a.titleHistory.lastTimePlayed).getTime();
        const dateB = new Date(b.titleHistory.lastTimePlayed).getTime();
        return dateB - dateA;
      })
      .slice(0, 6); // Get 6 most recent games for vertical display

    console.log('Filtered titles:', {
      filteredCount: titles.length,
      totalCount: data.titles?.length || 0,
      firstFilteredTitle: titles[0],
      hasAchievementData: !!titles[0]?.achievement
    });

    const duration = Date.now() - startTime;
    trackEvent('XboxTitleHistory_Success', {
      duration,
      count: titles.length,
    });

    return NextResponse.json({
      titles,
    });
  } catch (error) {
    console.error('Title history fetch error:', error);
    trackException(error as Error, {
      operation: 'XboxTitleHistory',
      duration: Date.now() - startTime,
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch Xbox title history',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
