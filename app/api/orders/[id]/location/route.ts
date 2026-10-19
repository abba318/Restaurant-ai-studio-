import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { OrderLocation } from '@/lib/types';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { latitude, longitude, accuracy } = body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json({ success: false, error: 'Valid numeric latitude and longitude required' }, { status: 400 });
    }

    const order = await db.getOrderById(id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const location: OrderLocation = {
      latitude,
      longitude,
      accuracy: typeof accuracy === 'number' ? accuracy : undefined,
      mapUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
      capturedAt: new Date().toISOString(),
    };

    const updated = await db.updateOrderLocation(id, location);

    return NextResponse.json({
      success: true,
      message: 'Location attached successfully',
      location: updated?.location,
    });
  } catch (error) {
    console.error('[API Order Location Error]:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update location' },
      { status: 500 }
    );
  }
}
