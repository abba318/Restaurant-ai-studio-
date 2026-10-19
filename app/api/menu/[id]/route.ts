import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await db.getMenuItemById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Menu item not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.name === 'string') updates.name = body.name.trim();
    if (typeof body.category === 'string') updates.category = body.category.trim();
    if (typeof body.price === 'number') updates.price = Math.round(body.price);
    if (typeof body.description === 'string') updates.description = body.description.trim();
    if (typeof body.image === 'string') updates.image = body.image.trim();
    if (typeof body.isAvailable === 'boolean') updates.isAvailable = body.isAvailable;
    if (typeof body.preparationTimeMinutes === 'number') updates.preparationTimeMinutes = body.preparationTimeMinutes;
    if (typeof body.spicyLevel === 'number') updates.spicyLevel = body.spicyLevel;
    if (Array.isArray(body.tags)) updates.tags = body.tags;
    if (typeof body.isFeatured === 'boolean') updates.isFeatured = body.isFeatured;

    const updated = await db.updateMenuItem(id, updates);
    return NextResponse.json({ success: true, menuItem: updated });
  } catch (error) {
    console.error('[API Menu PUT Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to update menu item' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const deleted = await db.deleteMenuItem(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Menu item not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    console.error('[API Menu DELETE Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete menu item' }, { status: 500 });
  }
}
