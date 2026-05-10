import { createHash } from "crypto";
import type { NextRequest } from "next/server";

/**
 * Returns a SHA-256 hash of the visitor's IP. We never store the raw IP.
 * Salted with a per-deploy secret so two sites can't cross-reference visitors.
 */
export function ipHashFromRequest(req: NextRequest | Request): string {
  const ip = extractIp(req);
  const salt = process.env.IP_SALT || "aetech-default-salt-rotate-me";
  return createHash("sha256")
    .update(`${ip}:${salt}`)
    .digest("hex")
    .slice(0, 32);
}

function extractIp(req: NextRequest | Request): string {
  // Try common proxy headers first
  const headers = req.headers;
  const candidates = [
    headers.get("x-forwarded-for"),
    headers.get("x-real-ip"),
    headers.get("cf-connecting-ip"),
  ];
  for (const c of candidates) {
    if (c) return c.split(",")[0].trim();
  }
  // Fallback
  return "unknown";
}
