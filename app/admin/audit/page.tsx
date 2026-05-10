import { dbConnect } from "@/lib/db";
import { AdminAction } from "@/models/AdminAction";
import { Shield } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getActions() {
  await dbConnect();
  const actions = await AdminAction.find({})
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  return JSON.parse(JSON.stringify(actions)) as any[];
}

export default async function AuditPage() {
  const actions = await getActions();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="h-display text-[28px] tracking-tighter mb-2">
          Audit log
        </h1>
        <p className="text-[14px] text-ink-2 leading-relaxed max-w-2xl">
          Sensitive admin actions over the last 90 days. Newest first. Records
          auto-prune after 90 days. To extend retention, change the TTL on the
          AdminAction collection.
        </p>
      </div>

      {actions.length === 0 ? (
        <p className="text-[13px] text-ink-3 italic py-12 text-center bg-tint-1 rounded-xl">
          No admin actions have been recorded yet.
        </p>
      ) : (
        <div className="rounded-xl border border-rule bg-white overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-tint-1 text-left text-[10.5px] font-mono uppercase tracking-wider text-ink-3">
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Who</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {actions.map((a) => (
                <tr
                  key={a._id}
                  className="hover:bg-tint-1/40 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-[11.5px] text-ink-2 whitespace-nowrap">
                    {formatDate(a.createdAt)}{" "}
                    <span className="text-ink-3">
                      {new Date(a.createdAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink">{a.userEmail || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 font-mono text-[11.5px] px-2 py-0.5 rounded"
                      style={{
                        background: "var(--brand-100)",
                        color: "var(--brand)",
                      }}
                    >
                      <Shield className="w-3 h-3" strokeWidth={2} />
                      {a.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-2">
                    {a.entityType && (
                      <>
                        <span className="text-ink-3">{a.entityType}:</span>{" "}
                        <span className="font-mono">
                          {a.entityLabel || a.entityId || "—"}
                        </span>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
