import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { signJwt } from "@/lib/jwt";
import { AUTH_COOKIE } from "@/lib/auth-server";
import { ipHashFromRequest } from "@/lib/ip-hash";

export const dynamic = "force-dynamic";

const PASSWORD_MIN_LEN = 8;
const NAME_MIN_LEN = 2;

/**
 * POST /api/auth/signup
 * Body: { name, email, password, consent: true }
 * Creates a new account with role='user'.
 *
 * Admins are NOT created here — they're seeded manually via SEED_ADMIN_EMAIL
 * to keep this endpoint privilege-free.
 */
export async function POST(req: NextRequest) {
  try {
    const { name, email, password, consent } = await req.json();

    // Validation
    if (!name || String(name).trim().length < NAME_MIN_LEN) {
      return NextResponse.json(
        { ok: false, error: "Please provide your name." },
        { status: 400 },
      );
    }
    if (!email || !/\S+@\S+\.\S+/.test(String(email))) {
      return NextResponse.json(
        { ok: false, error: "Please provide a valid email." },
        { status: 400 },
      );
    }
    if (!password || String(password).length < PASSWORD_MIN_LEN) {
      return NextResponse.json(
        {
          ok: false,
          error: `Password must be at least ${PASSWORD_MIN_LEN} characters.`,
        },
        { status: 400 },
      );
    }
    if (!consent) {
      return NextResponse.json(
        { ok: false, error: "Please accept the terms to continue." },
        { status: 400 },
      );
    }

    await dbConnect();
    const lowerEmail = String(email).toLowerCase().trim();

    // Existing email? Tell them to sign in instead.
    const existing = await User.findOne({ email: lowerEmail }).lean();
    if (existing) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "An account with this email already exists. Try signing in instead.",
          code: "email-exists",
        },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(String(password), 12);
    const ipHash = ipHashFromRequest(req);

    const created: any = await User.create({
      name: String(name).trim(),
      email: lowerEmail,
      passwordHash,
      role: "user",
      signupSource: "password",
      consentAt: new Date(),
      consentVersion: "2026-01",
      signupIpHash: ipHash,
      lastSignInAt: new Date(),
      lastSignInIpHash: ipHash,
    });

    // Issue session cookie
    const token = await signJwt({
      sub: String(created._id),
      email: created.email,
      name: created.name,
      role: created.role,
    });

    const res = NextResponse.json({
      ok: true,
      user: {
        id: String(created._id),
        email: created.email,
        name: created.name,
        role: created.role,
      },
    });

    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return res;
  } catch (err: any) {
    console.error("[signup]", err);
    return NextResponse.json(
      { ok: false, error: "Could not create account. Please try again." },
      { status: 500 },
    );
  }
}
