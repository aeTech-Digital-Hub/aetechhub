import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Research } from '@/models';
import { requireAdmin } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  await dbConnect();
  const limit = Number(req.nextUrl.searchParams.get('limit') || 0);
  const published = req.nextUrl.searchParams.get('published');

  const q: any = {};
  if (published !== '0') q.published = true;
  else {
    const user = await requireAdmin();
    if (!user) q.published = true;
  }

  let cursor = Research.find(q).sort({ publishedAt: -1, createdAt: -1 });
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
  const r = await Research.create(body);
  return NextResponse.json({ ok: true, item: r });
}
