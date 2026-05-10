import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/google/start?next=/somewhere
 *
 * Redirects to Google's consent screen. We pack the `next` URL into the
 * OAuth `state` parameter so the callback can route the user where they wanted to go.
 *
 * Required env:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_REDIRECT_URI  (e.g. https://aetechdigitalhub.com/api/auth/google/callback)
 */
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return new NextResponse(
      "Google sign-in is not configured. Please contact support.",
      { status: 500 },
    );
  }

  const url = new URL(req.url);
  const next = url.searchParams.get("next") || "/";

  // CSRF-resistant state — random nonce + intended next URL, both signed via cookie
  const nonce = randomBytes(16).toString("hex");
  const state = `${nonce}.${encodeURIComponent(next)}`;

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("access_type", "online");
  authUrl.searchParams.set("prompt", "select_account");

  const res = NextResponse.redirect(authUrl.toString());
  // Set the nonce cookie — the callback verifies state.startsWith(nonce)
  res.cookies.set("aetech_oauth_state", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });
  return res;
}
