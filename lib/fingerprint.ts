"use client";

const KEY = "aetech_bid";

/** Returns a stable browser fingerprint UUID, creating one on first call. */
export function getOrCreateFingerprint(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // Private mode etc — ephemeral fingerprint for the session
    return crypto.randomUUID?.() || `temp-${Date.now()}`;
  }
}

/** Returns the existing fingerprint or null — does NOT create a new one */
export function readFingerprint(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
