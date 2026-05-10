import { dbConnect } from '@/lib/db';
import { Track } from '@/models';
import { Brief } from '@/models/Project';
import { Booking } from '@/models';
import { FunnelClient } from '@/components/admin/FunnelClient';

export default async function FunnelPage() {
  await dbConnect();
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const [byEvent, byPath, daily, leadCount, bookingCount] = await Promise.all([
    Track.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$event', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Track.aggregate([
      { $match: { event: 'page_view', createdAt: { $gte: since } } },
      { $group: { _id: '$path', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Track.aggregate([
      { $match: { event: 'page_view', createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, views: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Brief.countDocuments({ createdAt: { $gte: since } }),
    Booking.countDocuments({ createdAt: { $gte: since } }),
  ]);

  const totalViews = byEvent.find((e: any) => e._id === 'page_view')?.count || 0;
  const ctaClicks  = byEvent.find((e: any) => e._id === 'cta_click')?.count || 0;
  const scopeStarted = byEvent.find((e: any) => e._id === 'scope_started_optin')?.count || 0;
  const scopeComplete = byEvent.find((e: any) => e._id === 'scope_complete')?.count || 0;
  const briefSubmitted = byEvent.find((e: any) => e._id === 'brief_submitted')?.count || 0;
  const bookingSubmitted = byEvent.find((e: any) => e._id === 'booking_submitted')?.count || 0;

  return (
    <FunnelClient
      kpis={{ totalViews, ctaClicks, scopeStarted, scopeComplete, briefSubmitted, bookingSubmitted, leadCount, bookingCount }}
      byPath={byPath}
      byEvent={byEvent}
      daily={daily}
    />
  );
}
