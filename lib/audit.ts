import { AdminAction } from "@/models/AdminAction";
import { dbConnect } from "@/lib/db";
import { ipHashFromRequest } from "@/lib/ip-hash";

/**
 * Record a sensitive admin action for audit. Best-effort — never throws,
 * never blocks the action it's logging.
 *
 * Usage:
 *   await recordAdminAction({
 *     user: { id, email },
 *     action: 'invoice.share',
 *     entity: { type: 'invoice', id: inv._id, label: inv.invoiceNo },
 *     req,                                     // optional, for ipHash + UA
 *     metadata: { sentTo: 'client@example.com' },
 *   });
 */
export async function recordAdminAction(params: {
  user: { id: string; email?: string };
  action: string;
  entity?: { type: string; id?: string; label?: string };
  req?: Request;
  metadata?: Record<string, unknown>;
}) {
  try {
    await dbConnect();
    await AdminAction.create({
      userId: params.user.id,
      userEmail: params.user.email,
      action: params.action,
      entityType: params.entity?.type,
      entityId: params.entity?.id,
      entityLabel: params.entity?.label,
      ipHash: params.req ? ipHashFromRequest(params.req) : undefined,
      userAgent:
        params.req?.headers.get("user-agent")?.slice(0, 200) || undefined,
      metadata: params.metadata,
    });
  } catch (err) {
    // Audit must never break the path it's auditing
    console.error("[audit]", err);
  }
}
