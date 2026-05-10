import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Announcement } from '@/models';
import { requireAdmin } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  await dbConnect();
  const pinned = req.nextUrl.searchParams.get('pinned');
  const published = req.nextUrl.searchParams.get('published');
  const limit = Number(req.nextUrl.searchParams.get('limit') || 0);

  const q: any = {};
  if (published !== '0') q.published = true;     // admin can pass ?published=0 to see drafts too
  else {
    // Admin-only access for unpublished items
    const user = await requireAdmin();
    if (!user) q.published = true;
  }
  if (pinned === '1') q.pinned = true;

  let cursor = Announcement.find(q).sort({ pinned: -1, publishedAt: -1, createdAt: -1 });
  if (limit) cursor = cursor.limit(limit);
  const items = await cursor.lean();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  await dbConnect();
  const body = await req.json();
  if (body.published && !body.publishedAt) body.publishedAt = new Date();
  const a = await Announcement.create(body);
  return NextResponse.json({ ok: true, item: a });
}
