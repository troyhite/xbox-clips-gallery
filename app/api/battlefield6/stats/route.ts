import { NextResponse } from 'next/server';
import { getBattlefield6Stats } from '@/lib/trackerApi';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') as 'origin' | 'xbl' | 'psn';
    const playerName = searchParams.get('playerName');

    if (!playerName) {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }

    if (!platform || !['origin', 'xbl', 'psn'].includes(platform)) {
      return NextResponse.json(
        { error: 'Valid platform is required (origin, xbl, or psn)' },
        { status: 400 }
      );
    }

    const stats = await getBattlefield6Stats(platform, playerName);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching Battlefield 6 stats:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
