import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  try {
    const analytics = await db.getAnalytics();
    return NextResponse.json({ success: true, analytics });
  } catch (error) {
    console.error('[API Admin Analytics Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve analytics' }, { status: 500 });
  }
}
