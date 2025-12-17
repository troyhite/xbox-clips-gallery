import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for compilation status (in production, use Redis or database)
const compilationStatus = new Map<string, {
  status: 'processing' | 'completed' | 'failed';
  message: string;
  progress: number;
  videoUrl?: string;
  error?: string;
}>();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
  }

  const status = compilationStatus.get(jobId);

  if (!status) {
    // If status not found, assume it's still processing
    return NextResponse.json({
      status: 'processing',
      message: 'Processing video...',
      progress: 10,
    });
  }

  return NextResponse.json(status);
}

export async function POST(request: NextRequest) {
  try {
    const { jobId, status, message, progress, videoUrl, error } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    compilationStatus.set(jobId, {
      status,
      message,
      progress,
      videoUrl,
      error,
    });

    // Clean up old entries after 1 hour
    setTimeout(() => {
      compilationStatus.delete(jobId);
    }, 3600000);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
