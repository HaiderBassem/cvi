import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { getMediaAssets, createMediaAsset, deleteMediaAsset } from '@/lib/db';
import { getSession } from '@/lib/auth';

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/** sharp format → stored extension and served MIME type. */
const ALLOWED_FORMATS: Record<string, { ext: string; mime: string }> = {
  jpeg: { ext: '.jpg', mime: 'image/jpeg' },
  png: { ext: '.png', mime: 'image/png' },
  webp: { ext: '.webp', mime: 'image/webp' },
  gif: { ext: '.gif', mime: 'image/gif' },
  avif: { ext: '.avif', mime: 'image/avif' },
};

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const assets = getMediaAssets();
  return NextResponse.json({ success: true, data: assets });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const altText = (formData.get('altText') as string) || '';
    const caption = (formData.get('caption') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Images must be 15 MB or smaller.' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Trust the decoded bytes, not the browser's MIME type or the file name:
    // only real raster images are stored (no SVG/HTML that could run script).
    let meta: sharp.Metadata;
    try {
      meta = await sharp(buffer).metadata();
    } catch {
      return NextResponse.json({ error: 'That file is not an image we can use (JPG, PNG, WebP, GIF or AVIF).' }, { status: 415 });
    }
    const format = meta.format ? ALLOWED_FORMATS[meta.format] : undefined;
    if (!format) {
      return NextResponse.json({ error: 'That file is not an image we can use (JPG, PNG, WebP, GIF or AVIF).' }, { status: 415 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const baseName =
      path
        .basename(file.name, path.extname(file.name))
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60) || 'image';
    const filename = `${Date.now()}-${baseName}${format.ext}`;
    fs.writeFileSync(path.join(uploadDir, filename), buffer);

    const width = meta.width || 0;
    const height = meta.height || 0;

    const asset = createMediaAsset({
      filename,
      url: `/uploads/${filename}`,
      mime_type: format.mime,
      size_bytes: file.size,
      width,
      height,
      alt_text: altText,
      caption: caption,
      credit: 'CVI Architects',
      focal_point_x: 0.5,
      focal_point_y: 0.5,
    });

    return NextResponse.json({ success: true, data: asset }, { status: 201 });
  } catch (error) {
    console.error('[api] media upload:', error);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
    }

    deleteMediaAsset(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api] media delete:', error);
    return NextResponse.json({ error: 'Delete failed. Please try again.' }, { status: 500 });
  }
}
