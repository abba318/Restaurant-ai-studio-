import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';
import { OrderStatus } from '@/lib/types';
import { sendOrderStatusUpdateEmail } from '@/lib/mailer';

const VALID_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, note } = body;

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const order = await db.getOrderById(id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const updated = await db.updateOrderStatus(id, status, note);

    if (updated) {
      const appBaseUrl = process.env.APP_URL || (req.headers.get('origin') ?? 'http://localhost:3000');
      sendOrderStatusUpdateEmail(updated, status, note, appBaseUrl).catch((mailErr) => {
        console.warn('[Gmail Status Email Warning]:', mailErr);
      });
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('[API Order Status PATCH Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to update order status' }, { status: 500 });
  }
}
