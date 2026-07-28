import mongoose from "mongoose";

/**
 * Mongoose connection with pool caps sized for Render Starter (512 MB RAM).
 *
 * Defaults Mongoose uses:
 *   maxPoolSize: 100    ← way too high for 512 MB
 *   minPoolSize: 0
 *   maxIdleTimeMS: 0    ← connections never close
 *
 * Overrides below cut idle memory pressure dramatically without hurting
 * throughput at your traffic volume. Adjust when scaling up.
 */

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

// Global cache — prevents duplicate connections across hot-reload in dev
// and across serverless invocations.
type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: Cached | undefined;
}

const cached: Cached = global.mongooseCache ?? { conn: null, promise: null };
if (!global.mongooseCache) global.mongooseCache = cached;

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI as string, {
      // ── Pool sizing (the big memory win) ────────────
      maxPoolSize: 10, // was 100 default
      minPoolSize: 1, // keep one warm connection
      maxIdleTimeMS: 30_000, // close idle connections after 30s
      // ── Timeouts (fail fast, don't hang) ────────────
      serverSelectionTimeoutMS: 5_000,
      socketTimeoutMS: 45_000,
      // ── Behaviour ───────────────────────────────────
      bufferCommands: false, // fail immediately if not connected
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
