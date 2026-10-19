import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const payments = await db.getPayments(limit);
    return NextResponse.json({ success: true, payments });
  } catch (error) {
    console.error('[API Admin Payments Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve payments' }, { status: 500 });
  }
}
