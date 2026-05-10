import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Message } from '@/models';
import { requireAdmin } from '@/lib/auth-server';

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ items: [] }, { status: 401 });

  await dbConnect();
  const items = await Message.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$sessionId',
        lastText: { $first: '$text' },
        name: { $first: '$name' },
        email: { $first: '$email' },
        updatedAt: { $first: '$createdAt' },
        unread: {
          $sum: { $cond: [{ $and: [{ $eq: ['$sender', 'client'] }, { $ne: ['$read', true] }] }, 1, 0] },
        },
      },
    },
    { $sort: { updatedAt: -1 } },
    { $limit: 100 },
  ]);

  return NextResponse.json({ items: items.map(i => ({ sessionId: i._id, ...i })) });
}
