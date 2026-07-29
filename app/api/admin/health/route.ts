import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/health
 * Admin-only diagnostic endpoint.
 *
 * Returns memory usage, mongoose connection state, and process info.
 * Poll this from a browser tab while under load to see what's leaking.
 */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const mem = process.memoryUsage();
  const toMB = (n: number) => Math.round((n / 1024 / 1024) * 10) / 10;

  return NextResponse.json({
    ok: true,
    memory: {
      rss_mb: toMB(mem.rss), // Total resident set size
      heapTotal_mb: toMB(mem.heapTotal), // V8 heap allocated
      heapUsed_mb: toMB(mem.heapUsed), // V8 heap used
      external_mb: toMB(mem.external), // C++ objects bound to JS
      arrayBuffers_mb: toMB(mem.arrayBuffers), // Buffer/ArrayBuffer memory
    },
    mongoose: {
      readyState: mongoose.connection.readyState, // 1 = connected
      readyStateLabel:
        ["disconnected", "connected", "connecting", "disconnecting"][
          mongoose.connection.readyState
        ] || "unknown",
      models: Object.keys(mongoose.models).length,

      poolSize:
        (mongoose.connection as any)?.client?.topology?.s?.pool
          ?.totalConnectionCount ?? null,
    },
    process: {
      uptime_seconds: Math.round(process.uptime()),
      node_version: process.version,
      platform: process.platform,
      pid: process.pid,
    },
    at: new Date().toISOString(),
  });
}
