import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cleanId = decodeURIComponent(id).trim();

    // Check by ID or by Order Number (e.g., NG-8492)
    let order = await db.getOrderById(cleanId);
    if (!order) {
      order = await db.getOrderByNumber(cleanId);
    }
    if (!order) {
      order = await db.getOrderByPaymentReference(cleanId);
    }

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('[API Order Lookup Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve order' }, { status: 500 });
  }
}
