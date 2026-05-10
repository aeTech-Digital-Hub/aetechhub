import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { signJwt } from "@/lib/jwt";
import { AUTH_COOKIE } from "@/lib/auth-server";
import { ipHashFromRequest } from "@/lib/ip-hash";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/auth/google/callback?code=...&state=...
 *
 * Exchanges the auth code for an access token, fetches the Google profile,
 * and either creates a new user or links to an existing email-account.
 *
 * Account linking rule: if a User already exists with the same email,
 * we link the Google ID to that account (no duplicate accounts created).
 * The user signs in seamlessly.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const stateNonce = state?.split(".")[0];
  const nextRaw = state?.split(".").slice(1).join(".") || "/";
  const next = safeNext(decodeURIComponent(nextRaw));

  // Verify state nonce against the cookie
  const cookieNonce = req.cookies.get("aetech_oauth_state")?.value;
  if (!code || !stateNonce || !cookieNonce || stateNonce !== cookieNonce) {
    return errorRedirect(next, "invalid-state");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    return errorRedirect(next, "oauth-not-configured");
  }

  // Exchange code for tokens
  let tokens: any;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    tokens = await tokenRes.json();
    if (!tokens.access_token) throw new Error("no-access-token");
  } catch (err) {
    console.error("[google callback] token exchange failed", err);
    return errorRedirect(next, "token-exchange");
  }

  // Fetch userinfo
  let profile: any;
  try {
    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      },
    );
    profile = await profileRes.json();
    if (!profile.email || !profile.id) throw new Error("no-profile");
  } catch (err) {
    console.error("[google callback] profile fetch failed", err);
    return errorRedirect(next, "profile-fetch");
  }

  // Look up / create / link user
  await dbConnect();
  const lowerEmail = String(profile.email).toLowerCase();
  const ipHash = ipHashFromRequest(req);

  let user: any = await User.findOne({ email: lowerEmail });
  if (user) {
    // Existing account — link Google ID if not already, update sign-in metadata
    if (!user.googleId) user.googleId = profile.id;
    if (!user.avatar && profile.picture) user.avatar = profile.picture;
    user.lastSignInAt = new Date();
    user.lastSignInIpHash = ipHash;
    await user.save();
  } else {
    // New account — create with Google source
    user = await User.create({
      name: profile.name || profile.email.split("@")[0],
      email: lowerEmail,
      googleId: profile.id,
      avatar: profile.picture,
      role: "user",
      signupSource: "google",
      consentAt: new Date(),
      consentVersion: "2026-01",
      signupIpHash: ipHash,
      lastSignInAt: new Date(),
      lastSignInIpHash: ipHash,
    });
  }

  // Issue session cookie
  const token = await signJwt({
    sub: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const res = NextResponse.redirect(new URL(next, req.url));
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  // Clear the OAuth nonce cookie
  res.cookies.set("aetech_oauth_state", "", { path: "/", maxAge: 0 });
  return res;
}

/** Whitelist relative-only paths so attackers can't open-redirect us */
function safeNext(input: string): string {
  if (!input) return "/";
  // Reject absolute URLs, protocol-relative, and obvious shenanigans
  if (input.startsWith("//") || /^[a-z]+:/i.test(input)) return "/";
  if (!input.startsWith("/")) return "/";
  return input;
}

function errorRedirect(next: string, reason: string): NextResponse {
  const url = new URL(
    "/sign-in",
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  );
  url.searchParams.set("error", reason);
  url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}
