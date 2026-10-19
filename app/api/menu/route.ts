import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';
    const menuItems = await db.getMenuItems(!all);
    return NextResponse.json({ success: true, menuItems });
  } catch (error) {
    console.error('[API Menu GET Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch menu items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, category, price, description, image, spicyLevel, tags, isFeatured, preparationTimeMinutes } = body;

    if (!name || !category || typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed: name, category, and non-negative price are required' },
        { status: 400 }
      );
    }

    const newItem = await db.createMenuItem({
      name: String(name).trim(),
      category: String(category).trim(),
      price: Math.round(price),
      description: String(description || '').trim(),
      image: String(image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80').trim(),
      isAvailable: body.isAvailable !== false,
      preparationTimeMinutes: Number(preparationTimeMinutes) || 20,
      spicyLevel: (Number(spicyLevel) || 0) as 0 | 1 | 2 | 3,
      tags: Array.isArray(tags) ? tags.map(String) : [],
      isFeatured: Boolean(isFeatured),
    });

    return NextResponse.json({ success: true, menuItem: newItem }, { status: 201 });
  } catch (error) {
    console.error('[API Menu POST Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to create menu item' }, { status: 500 });
  }
}
