import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { isAdminAuthenticated } from '@/lib/auth';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No image file provided' }, { status: 400 });
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file format. Please upload JPEG, PNG, or WebP images.' },
        { status: 400 }
      );
    }

    // Max 8MB
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'Image exceeds 8MB limit' }, { status: 400 });
    }

    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop() || 'jpg';
    const cleanExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'jpg';
    const randomName = `dish-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${cleanExt}`;
    const filePath = path.join(UPLOADS_DIR, randomName);

    await fs.promises.writeFile(filePath, buffer);

    const imageUrl = `/uploads/${randomName}`;
    return NextResponse.json({ success: true, imageUrl });
  } catch (err) {
    console.error('[Admin Image Upload Error]:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Image upload failed' },
      { status: 500 }
    );
  }
}
