'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';

export function FunnelClient({ kpis, byPath, byEvent, daily }: any) {
  const funnelSteps = [
    { name: 'Page views',         count: kpis.totalViews },
    { name: 'CTA clicks',         count: kpis.ctaClicks },
    { name: 'Scope started',      count: kpis.scopeStarted },
    { name: 'Scope complete',     count: kpis.scopeComplete },
    { name: 'Brief submitted',    count: kpis.briefSubmitted },
    { name: 'Booking submitted',  count: kpis.bookingSubmitted },
  ];
  const max = Math.max(...funnelSteps.map(s => s.count), 1);

  return (
    <div className="space-y-10">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-purple-700 mb-2">— Funnel · last 30 days</p>
        <h1 className="h-display text-4xl">Activity & conversion</h1>
      </div>

      {/* Funnel visualisation */}
      <div className="border border-rule bg-bone p-6">
        <h3 className="font-display text-xl mb-5">Conversion funnel</h3>
        <div className="space-y-3">
          {funnelSteps.map((step, i) => {
            const pct = (step.count / max) * 100;
            const stepPct = i > 0 && funnelSteps[i-1].count > 0 ? (step.count / funnelSteps[i-1].count) * 100 : 100;
            return (
              <div key={step.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{step.name}</span>
                  <span className="font-mono text-xs">{step.count.toLocaleString()} {i > 0 && <span className="text-ink/40 ml-2">({stepPct.toFixed(1)}%)</span>}</span>
                </div>
                <div className="h-3 bg-cream rounded-sm overflow-hidden">
                  <div className="h-full bg-purple-700" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily traffic */}
      <div className="border border-rule bg-bone p-6">
        <h3 className="font-display text-xl mb-5">Daily page views</h3>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={daily.map((d: any) => ({ date: d._id.slice(5), views: d.views }))}>
              <CartesianGrid stroke="#E8E2DA" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="views" stroke="#2D0D50" strokeWidth={2} dot={{ fill: '#C9A84C', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top pages */}
        <div className="border border-rule bg-bone p-6">
          <h3 className="font-display text-xl mb-5">Top pages</h3>
          <div className="space-y-2">
            {byPath.length === 0 && <p className="text-sm text-ink/50 italic">No data yet.</p>}
            {byPath.map((p: any) => (
              <div key={p._id} className="flex justify-between items-center text-sm py-2 border-b border-rule last:border-0">
                <span className="font-mono text-xs">{p._id || '/'}</span>
                <span className="text-ink/60">{p.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Events breakdown */}
        <div className="border border-rule bg-bone p-6">
          <h3 className="font-display text-xl mb-5">Events</h3>
          <div className="space-y-2">
            {byEvent.length === 0 && <p className="text-sm text-ink/50 italic">No data yet.</p>}
            {byEvent.map((e: any) => (
              <div key={e._id} className="flex justify-between items-center text-sm py-2 border-b border-rule last:border-0">
                <span>{e._id}</span>
                <span className="font-mono text-xs">{e.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
